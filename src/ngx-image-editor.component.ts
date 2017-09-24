import {AfterViewInit, Component, Inject, OnDestroy, ViewEncapsulation, Optional, ViewChild} from '@angular/core';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';
declare const Cropper: any;

@Component({
    selector: 'ngx-image-editor',
    template: `
    <div class="ngx-image-editor-component" fxLayout="column" fxLayoutAlign="center stretch">
    <div md-dialog-title class="photo-editor-header">
        <md-icon>photo</md-icon>
        <div class="file-name">{{state.name}}</div>
        <button [hidden]="croppedImage" md-icon-button color="accent" mdTooltip="Crop image" (click)="handleCrop()">
            <md-icon>crop</md-icon>
        </button>
        <button md-icon-button
                [hidden]="croppedImage"
                color="accent"
                mdTooltip="Center canvas"
                (click)="centerCanvas()">
            <md-icon>center_focus_strong</md-icon>
        </button>
        <button md-icon-button mdTooltip="Fullscreen">
            <md-icon>fullscreen</md-icon>
        </button>
        <button md-icon-button mdTooltip="Close" (click)="dialogRef.close()">
            <md-icon>clear</md-icon>
        </button>
    </div>

    <div md-dialog-content
         #dialogCropContainer
         class="dialog-crop-container"
         fxLayout="column"
         fxLayoutAlign="center center"
         fxFlex="grow">
        <ng-template [ngIf]="!croppedImage">
            <div
                [style.visibility]="loading ? 'hidden' : 'visible'"
                [style.background]="canvasFillColor"
                class="img-container">
                <img #previewimg
                     [src]="state.url">
            </div>
        </ng-template>
        <ng-template [ngIf]="croppedImage && !loading">
            <div class="cropped-image">
                <img #croppedImg
                     [ngStyle]="{'transform': 'scale(' + zoomIn + ')'}"
                     [src]="croppedImage">
            </div>
        </ng-template>
        <md-progress-spinner *ngIf="loading" mode="indeterminate"></md-progress-spinner>
    </div>

    <div
        class="dialog-button-actions"
        md-dialog-actions
        fxLayout="column"
        align="start"
        fxFlex="nogrow">

        <div class="image-detail-toolbar" fxFlex="100">
            <div class="image-dimensions"><b>Width:</b> {{imageWidth}}px <b>Height:</b> {{imageHeight}}px</div>
            <span fxFlex></span>
            <div class="image-zoom">
                <button md-icon-button color="accent" (click)="zoomChange(0.1, 'zoomIn')">
                    <md-icon>zoom_in</md-icon>
                </button>
                <md-slider [value]="sliderValue" [thumb-label]="true"></md-slider>
                <button md-icon-button color="accent" (click)="zoomChange(-0.1, 'zoomOut')">
                    <md-icon>zoom_out</md-icon>
                </button>
            </div>
        </div>
        <div class="cropped-image-buttons" [style.visibility]="!croppedImage ? 'hidden' : 'visible'">
            <button md-raised-button color="accent" (click)="saveImage()">
                <md-icon>done</md-icon>
                <span>Save</span>
            </button>
            <button md-raised-button color="accent" (click)="undoCrop()">
                <md-icon>undo</md-icon>
                <span>Undo</span>
            </button>
        </div>
        <div fxLayout="row" [style.visibility]="croppedImage ? 'hidden' : 'visible'">
            <md-button-toggle-group
                #dragMode="mdButtonToggleGroup"
                (change)="cropper.setDragMode($event.value)"
                value="move">
                <md-button-toggle value="move" mdTooltip="Move mode">
                    <md-icon>open_with</md-icon>
                </md-button-toggle>
                <md-button-toggle value="crop" mdTooltip="Crop mode">
                    <md-icon>crop</md-icon>
                </md-button-toggle>
            </md-button-toggle-group>

            <md-button-toggle-group
                #selectRatio="mdButtonToggleGroup"
                (change)="cropper.setAspectRatio($event.value)"
                value="{{ratios[0].value}}">
                <md-button-toggle *ngFor="let ratio of ratios" value="{{ratio.value}}" mdTooltip="Aspect ratio">
                    {{ratio.text}}
                </md-button-toggle>
            </md-button-toggle-group>

        </div>
        <div
            class="canvas-config"
            fxLayout="row"
            fxLayoutAlign="start space-between"
            fxLayoutGap="10px"
            [style.visibility]="croppedImage ? 'hidden' : 'visible'">

            <md-input-container color="accent"  fxFlex="100">
                <input mdInput
                       fxFlex="100"
                       id="imageWidth"
                       placeholder="Canvas width"
                       type="number"
                       (ngModelChange)="setImageWidth($event)"
                       [ngModel]="canvasWidth">
            </md-input-container>

            <md-input-container color="accent"  fxFlex="100">
                <input mdInput
                       fxFlex="100"
                       id="imageHeight"
                       placeholder="Canvas height"
                       type="number"
                       (ngModelChange)="setImageHeight($event)"
                       [ngModel]="canvasHeight">
            </md-input-container>

            <md-input-container color="accent"  fxFlex="100">
                <input mdInput
                       fxFlex="100"
                       id="cropBoxWidth"
                       placeholder="Cropbox width"
                       type="number"
                       (ngModelChange)="setCropBoxWidth($event)"
                       [ngModel]="cropBoxWidth">
            </md-input-container>

            <md-input-container color="accent"  fxFlex="100">
                <input mdInput
                       fxFlex="100"
                       id="cropBoxHeight"
                       placeholder="Cropbox height"
                       type="number"
                       (ngModelChange)="setCropBoxHeight($event)"
                       [ngModel]="cropBoxHeight">
            </md-input-container>

            <!--<md2-colorpicker [(ngModel)]="canvasFillColor"  placeholder="Canvas color"></md2-colorpicker>-->

        </div>
    </div>

</div>

`,
    styles: [`

        /*
     * Copyright (c) 2017 Connecto.AI. All rights reserved.
     */
        .ngx-image-editor-component .photo-editor-header {
            display: flex;
            justify-content: space-around;
            align-items: center;
            width: 100%;
            padding: 5px 0;
            background: #666;
            color: #FFF;
            z-index: 100;
            margin: 0;
        }
        .ngx-image-editor-component .photo-editor-header > .mat-icon {
            padding: 0 10px;
        }
        .ngx-image-editor-component .photo-editor-header > .file-name {
            flex: 1 1 100%;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }
        .ngx-image-editor-component md-progress-spinner {
            position: absolute;
        }
        .ngx-image-editor-component .dialog-crop-container {
            width: 800px;
            height: 400px;
            overflow: hidden;
        }
        .ngx-image-editor-component .cropper-bg {
            background-image: none !important;
        }
        .ngx-image-editor-component .cropper-bg > .cropper-modal {
            opacity: 1 !important;
            background: none;
        }
        .ngx-image-editor-component .img-container {
            width: 800px !important;
            height: 400px !important;
        }
        .ngx-image-editor-component .cropped-image img {
            width: auto !important;
            height: auto !important;
            max-width: 800px !important;
            max-height: 400px !important;
        }
        .ngx-image-editor-component .dialog-button-actions {
            background: #666;
            position: relative;
            padding: 0;
        }
        .ngx-image-editor-component .dialog-button-actions:last-child {
            margin: 0;
        }
        .ngx-image-editor-component .dialog-button-actions > DIV md-button-toggle-group {
            margin: 20px;
            background-color: white;
        }
        .ngx-image-editor-component .dialog-button-actions .cropped-image-buttons {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config {
            padding: 5px;
            margin: 0 20px;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config .mat-input-wrapper > .mat-input-table > .mat-input-infix {
            color: white !important;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config .mat-input-placeholder.mat-empty:not(.mat-focused) {
            color: white;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config .mat-input-underline {
            border-color: white;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config md2-colorpicker {
            width: 200px !important;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config md2-colorpicker .md2-colorpicker-input {
            border-bottom: 1px solid white !important;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config md2-colorpicker .color-picker-selector .md2-colorpicker-input .md2-colorpicker-value {
            color: white !important;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config md2-colorpicker .color-picker-selector {
            padding: 15px 0 !important;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config md2-colorpicker .color-picker-selector .md2-colorpicker-preview {
            top: 15px !important;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config md2-colorpicker .input-focused {
            color: #6ec140 !important;
            border-bottom-width: 1.2px;
            border-color: #6ec140 !important;
        }
        .ngx-image-editor-component .dialog-button-actions > .canvas-config md2-colorpicker .input-focused .md2-colorpicker-placeholder {
            color: #6ec140 !important;
        }
        .ngx-image-editor-component .dialog-button-actions .image-detail-toolbar {
            background-color: #272727;
            color: white;
            height: 40px;
            line-height: 40px;
        }
        .ngx-image-editor-component .dialog-button-actions .image-detail-toolbar > .image-zoom {
            display: flex;
            align-items: center;
            padding: 0 10px;
        }
        .ngx-image-editor-component .dialog-button-actions .image-detail-toolbar > .image-zoom .mat-slider-horizontal .mat-slider-wrapper {
            top: 23px !important;
        }
        .ngx-image-editor-component .dialog-button-actions .image-detail-toolbar > .image-zoom .mat-slider-horizontal .mat-slider-wrapper .mat-slider-thumb-container {
            cursor: grab;
        }
        .ngx-image-editor-component .dialog-button-actions .image-detail-toolbar > .image-zoom .mat-slider-horizontal .mat-slider-wrapper .mat-slider-thumb-container > .mat-slider-thumb {
            background-color: #6ec140 !important;
        }
        .ngx-image-editor-component .dialog-button-actions .image-detail-toolbar > .image-dimensions {
            padding: 0 10px;
            font-size: 14px;
            width: 200px;
            max-width: 200px;
        }

        .mat-dialog-content {
            margin: 0;
            padding: 0;
        }

        .mat-dialog-container {
            overflow: hidden !important;
            padding: 0;
        }










    `],
    encapsulation: ViewEncapsulation.None
})

export class NgxImageEditorComponent implements AfterViewInit, OnDestroy {

    public state: any;
    public cropper: any;
    public croppedImage: string;
    public imageWidth: number;
    public imageHeight: number;
    public canvasWidth: number;
    public canvasHeight: number;
    public cropBoxWidth: number;
    public cropBoxHeight: number;
    public canvasFillColor: string;
    public blob: Blob;
    public loading: boolean;
    private zoomIn: number;
    public sliderValue: number;

    public ratios = [
        {
            value: 16 / 9, text: '16:9'
        },
        {
            value: 4 / 3, text: '4:3'
        },
        {
            value: 1 / 1, text: '1:1'
        },
        {
            value: 2 / 3, text: '2:3'
        },
        {
            value: 0 / 0, text: 'None'
        }
    ];

    @ViewChild('previewimg')
    public previewImage: any;

    @ViewChild('croppedImg')
    public croppedImg: any;

    public constructor(public dialogRef: MdDialogRef<any>,
                       @Optional() @Inject(MD_DIALOG_DATA)
                       private data: any) {
        this.zoomIn = 0;
        this.sliderValue = 0;
        this.loading = true;
        this.state = data;
        this.canvasFillColor = '#fff';
    }

    public ngOnDestroy() {
        this.cropper.destroy();
    }

    public ngAfterViewInit(): void {
        this.initializeCropper();
    }

    public handleCrop() {

        this.loading = true;
        setTimeout(() => {
            this.croppedImage = this.cropper.getCroppedCanvas({fillColor: this.canvasFillColor})
                .toDataURL('image/jpeg');

            setTimeout(() => {
                this.imageWidth = this.croppedImg.nativeElement.width;
                this.imageHeight = this.croppedImg.nativeElement.height;
            });
            this.cropper.getCroppedCanvas({fillColor: this.canvasFillColor}).toBlob((blob: Blob) => {
                this.blob = blob;
            });
            this.zoomIn = 1;
            this.loading = false;
        }, 2000);
    }

    public undoCrop() {
        this.croppedImage = null;
        this.blob = null;
        setTimeout(() => {
            this.initializeCropper();
        }, 100);

    }

    public saveImage() {
        this.dialogRef.close(
            {file: new File([this.blob], this.state.name, {type: this.state.type})}
        );
    }

    private initializeCropper() {
        this.cropper = new Cropper(this.previewImage.nativeElement, {
            aspectRatio: 16 / 9,
            zoomOnWheel: true,
            viewMode: 0,
            center: true,
            ready: () => this.loading = false,
            dragMode: 'move',
            crop: (e: CustomEvent) => {
                this.imageHeight = Math.round(e.detail.height);
                this.imageWidth = Math.round(e.detail.width);
                this.cropBoxWidth = Math.round(this.cropper.getCropBoxData().width);
                this.cropBoxHeight = Math.round(this.cropper.getCropBoxData().height);
                this.canvasWidth = Math.round(this.cropper.getCanvasData().width);
                this.canvasHeight = Math.round(this.cropper.getCanvasData().height);
            }
        });
    }

    public zoomChange(input: any, zoom?: string) {
        // TODO fix this implementation.
        if (this.croppedImage) {
            zoom === 'zoomIn' ? this.zoomIn += 0.1 : this.zoomIn -= 0.1;
            if (this.zoomIn <= 0.1) {
                this.zoomIn = 0.1;
            }
        } else {
            this.cropper.zoom(input);
            this.zoomIn = input;
        }
        input > 0 ? this.sliderValue += 1 : this.sliderValue -= 1;
        if (this.sliderValue < 0) {
            this.sliderValue = 0;
        }
    }

    public setImageWidth(canvasWidth: number) {
        if (canvasWidth) {
            this.cropper.setCanvasData({
                left: this.cropper.getCanvasData().left,
                top: this.cropper.getCanvasData().top,
                width: Math.round(canvasWidth),
                height: this.cropper.getCanvasData().height
            });
        }
    }

    public setImageHeight(canvasHeight: number) {
        if (canvasHeight) {
            this.cropper.setCanvasData({
                left: this.cropper.getCanvasData().left,
                top: this.cropper.getCanvasData().top,
                width: this.cropper.getCanvasData().width,
                height: Math.round(canvasHeight)
            });
        }
    }

    public setCropBoxWidth(cropBoxWidth: number) {
        if (cropBoxWidth) {
            this.cropper.setCropBoxData({
                left: this.cropper.getCropBoxData().left,
                top: this.cropper.getCropBoxData().top,
                width: Math.round(cropBoxWidth),
                height: this.cropper.getCropBoxData().height
            });
        }
    }

    public setCropBoxHeight(cropBoxHeight: number) {
        if (cropBoxHeight) {
            this.cropper.setCropBoxData({
                left: this.cropper.getCropBoxData().left,
                top: this.cropper.getCropBoxData().top,
                width: this.cropper.getCropBoxData().width,
                height: Math.round(cropBoxHeight)
            });
        }
    }

    public centerCanvas() {
        const cropBoxLeft = (this.cropper.getContainerData().width - this.cropper.getCropBoxData().width) / 2;
        const cropBoxTop = (this.cropper.getContainerData().height - this.cropper.getCropBoxData().height) / 2;
        const canvasLeft = (this.cropper.getContainerData().width - this.cropper.getCanvasData().width) / 2;
        const canvasTop = (this.cropper.getContainerData().height - this.cropper.getCanvasData().height) / 2;

        this.cropper.setCropBoxData({
            left: cropBoxLeft,
            top: cropBoxTop,
            width: this.cropper.getCropBoxData().width,
            height: this.cropper.getCropBoxData().height
        });
        this.cropper.setCanvasData({
            left: canvasLeft,
            top: canvasTop,
            width: this.cropper.getCanvasData().width,
            height: this.cropper.getCanvasData().height
        });
    }

}
