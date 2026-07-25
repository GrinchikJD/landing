class BabylonRender extends EzAlpineHTMLElement {

    ALPINE_COMPONENT_KEY = 'initBabylonRenderComponent';

    ELEMENT_ATTRIBUTES = [
        { 'class' : 'flex md:gap-8 flex-col md:flex-row w-full md:-my-[50px]' }
    ]

    EZ_HTML = /*html*/`
    <div class="flex items-center" @resize.window="checkIsMobile">
        <div :style="{ width: babylonConfig.w + 'px', height: babylonConfig.h + 'px'}"
            style="position: relative;"
            :class="{ 
                'animate-pulse rounded-md' : !isAllScriptsFetched, 
                'cursor-grab': (isAllScriptsFetched && !isGrabbing),
                'cursor-grabbing': (isAllScriptsFetched && isGrabbing)
            }"
            class="flex items-center mx-auto justify-center aspect-square max-w-full"
        >
            <img src="/src/svg/blocks-wave.svg" alt="Loading..." width="32" height="32" 
                class="svg-icon absolute z-10 pointer-events-none"
                x-show="!isAllScriptsFetched || isTexturesLoading" fetchpriority="high" loading="eager"
            />
            <img src="/src/3d/smartphone/preview.webp" 
                :width="babylonConfig.w" :height="babylonConfig.h" 
                title="Smartphone preview"
                alt="Smartphone preview"
                x-show="!isAllScriptsFetched"
                style="position: absolute; top:0; left:0;"
                :style="{ width: babylonConfig.w + 'px', height: babylonConfig.h + 'px'}"
                class="pointer-events-none"
            />
            <canvas id="main-canvas" :class="{ 'blur-sm' : isTexturesLoading }"
                class="w-full md:w-auto"
                style="outline:none;"></canvas>
            <div class="w-1/3 md:hidden absolute top-0 left-0 h-full"></div>
            <div class="w-1/3 md:hidden absolute top-0 right-0 h-full"></div>
        </div>
    </div>
    <div class="flex-grow flex flex-col items-start justify-center px-6 md:p-2 text-white max-md:pb-4">
        <h2 class="font-heading font-bold text-xl text-gray-400 max-md:hidden">Customization</h2>
        <div class="flex flex-col gap-4 my-4">
        <template x-for="(attribute, idx) in attributes" :key="attribute.code">
            <div :class="{ 'max-md:absolute top-4 left-6 max-md:flex items-center flex-col' : idx === 0}">
                <span class="font-heading font-bold" x-text="attribute.title">Title</span>
                <div class="flex items-center gap-2"
                    :class="{ 'max-md:flex-col max-md:mt-2' : idx === 0}"
                >
                    <template x-for="option in attribute.options" :key="option.code">
                        <button @click="applyTextureByCode(attribute.code, option.code)"
                            :title="'Select ' + option.code + ' ' + attribute.code"
                            class="aspect-square w-12 max-w-12 flex items-center justify-center rounded-lg bg-gray-600
                                transition-all duration-200  hover:outline-white hover:outline overflow-hidden
                                opacity-50 hover:opacity-100"
                            :class="{ 
                                'outline-accent outline bg-gray-400 opacity-100' : isSelectedOption(attribute, option),
                                'bg-gray-600 opacity-50' : !isSelectedOption(attribute, option)
                            }"
                        >
                            <img width="128" height="128"
                                :alt="'Select ' + option.code + ' ' + attribute.code"
                                :src="option.preview"
                                class="w-12 min-w-12 object-cover" 
                            />
                        </button>
                    </template>
                </div>
            </div>
        </template>
        </div>
        
        <label for="load-image" class="card card-magic rounded-full py-0.5">
            <div class="card-content font-semibold !rounded-full py-1 px-4 !bg-theme">
                🪄 Custom Cover
            </div>
            <input id="load-image" type="file" class="hidden" accept="image/png, image/jpeg, image/bmp, image/webp" />
        </label>

        <div x-show="catchedTexture" 
            class="absolute right-0 max-md:bottom-8 md:w-1/4 flex flex-col items-start justify-start z-10
                transition-all duration-200 max-md:opacity-30 max-md:focus-within:opacity-100 group">
            <div class="flex items-center justify-end relative cursor-move shadow-lg">
                <div class="phone-blueprint-preview border-2 border-gray-600
                        overflow-hidden flex items-center justify-center"
                    style="width: 141px; height: 300px; border-radius: 15px; background-color:#000;"
                >
                    <canvas id="fetch-image" tabindex="0" style="width: 141px; height: 300px;"></canvas>
                    <code class="absolute text-xs p-2 m-2 bg-theme-alpha z-10 group-hover:hidden rounded-lg"
                        x-text="isMobile ? 'Swipe over the image to change the position'
                        : 'Left mouse click + moving the cursor over this area will change the position of the image'"
                    ></code>
                </div>
            </div>
            <template x-if="catchedTexture">
                <div class="flex flex-col gap-2 items-center mt-2">
                    <label for="scale-texture" class="flex items-center gap-2" title="Scale parameter">
                        <img src="/src/svg/scale.svg" loading="lazy" width="16" height="16"
                            alt="scale logo" />
                        <input id="scale-texture" x-model:number="catchedTextureScale" type="range"  
                            min="20" max="500" style="width: 75%;" />
                    </label>
                    <label for="rotate-texture" class="flex items-center gap-2" title="Rotation parameter">
                        <img src="/src/svg/rotate.svg" loading="lazy" width="16" height="16"
                            alt="Rotate logo" />
                        <input id="rotate-texture" x-model:number="catchedTextureRotate" type="range"  
                            min="-180" max="180" style="width: 75%;" />
                    </label>
                </div>
            </template>
        </div>
    </div>
    `

    initBabylonRenderComponent() {
        return {
            canvas: null,
            engine: null,
            scene: null,
            camera: null,
            babylonConfig: {
                w: 400, h: 400
            },
            isGrabbing: false,
            mainMaterialLink: null,
            meshes: [],
            libs: [
                '/src/lib/babylon.js',
                '/src/lib/babylon_import.js'
            ],
            selectedColor: 'default',
            selectedSkin: 'default',
            textureBuffer: {},
            textureBufferFetchedNum: 0,
            attributes: [
                {code: 'color', title: "Color", options: [
                    { code: 'default', preview: '/src/3d/smartphone/options/color_default.webp' },
                    { code: 'silver', preview: '/src/3d/smartphone/options/color_silver.webp' },
                    { code: 'green', preview: '/src/3d/smartphone/options/color_green.webp' },
                ]},
                {code: 'skin', title: "Cover", options: [
                    { code: 'default', preview: '/src/3d/smartphone/options/skin_default.webp' },
                    { code: 'naruto', preview: '/src/3d/smartphone/options/skin_naruto.webp' },
                    { code: 'kitty', preview: '/src/3d/smartphone/options/skin_kitty.webp' },
                    { code: 'donttouch', preview: '/src/3d/smartphone/options/skin_donttouch.webp' }
                ]}
            ],
            isAllScriptsFetched: false,
            isTexturesLoading: false,
            imageAttachment: null,
            imageInput: null,
            imageInputCanvas: null,
            catchedTexture: null,
            catchedTextureX: 0,
            catchedTextureY: 0,
            catchedTextureScale: 100,
            catchedTextureRotate: 0,
            applyingDebounceMs: 500,
            applyingTimeout: null,
            isMobile: false,

            init() {
                this.canvas = this.$el.querySelector("#main-canvas");
                this.canvas.width = 400;
                this.canvas.height = 400;
                this.fetchScripts(this.startRender.bind(this));
                this.handleImageInput();
                ['catchedTextureX', 'catchedTextureY', 'catchedTextureScale', 'catchedTextureRotate']
                .forEach(variable => {
                    this.$watch(variable, this.handleImageInputImagePosition.bind(this));
                });
                this.checkIsMobile();
            },
            checkIsMobile() {
                this.isMobile = window.innerWidth < 768;
            },
            getAttributePreviewSrc(attr, opt) {
                return '/src/3d/smartphone/options/' + attr.code + '_' + opt.code + '.webp';
            },
            isSelectedOption(attr, opt) {
                if (attr.code === 'color') {
                    return this.selectedColor === opt.code;
                }
                return this.selectedSkin === opt.code;
            },
            fetchScripts(callback) {
                const numberToFetch = this.libs.length;
                let fetched = 0;
                const handleLoad = () => {
                    fetched++;
                    if (numberToFetch === fetched) {
                        callback(); return;
                    };
                    addScriptByIndex(fetched);
                }
                const addScriptByIndex = (idx) => {
                    if (document.head.querySelector('script[src="' + this.libs[idx] + '"]')) {
                        handleLoad.call(this);
                        return;
                    }
                    let newScript = document.createElement('script');
                    newScript.src = this.libs[idx];
                    newScript.onload = handleLoad.bind(this);
                    document.head.appendChild(newScript);
                }
                addScriptByIndex(fetched);
            },
            startRender() {
                this.engine = new BABYLON.Engine(this.canvas, true, {stencil:true});
                this.scene = this.createScene();
                this.scene.createDefaultEnvironment({
                    createGround: false,
                    enableGroundShadow: false,
                    createSkybox: false,
                    groundYBias: 1,
                    groundOpacity: 0,
                });
                this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
                this.engine.runRenderLoop(() => {
                    this.scene.render();
                });
            },
            createScene() {
                var scene = new BABYLON.Scene(this.engine);
                scene.useRightHandedSystem = true;

                const camera = new BABYLON.ArcRotateCamera(
                    "camera", -Math.PI / 5, Math.PI / 2.5, 5, new BABYLON.Vector3(0, 0, 0), scene
                );
                this.camera = camera;
                camera.attachControl(this.canvas, true);
                camera.wheelPrecision = 100;
                camera.lowerRadiusLimit = 4;
                camera.upperRadiusLimit = 5;
                camera.panningSensibility = 0;
                if (camera.inputs && camera.inputs.attached.pointers) {
                    camera.inputs.attached.pointers.multiTouchPanning = false;
                }

                scene.onPointerDown = () => { this.isGrabbing = true; };
                window.addEventListener('mousemove', () => { this.isGrabbing = false; });

                const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(-1.1, 0.5, 0.6), scene);
                light.position = new BABYLON.Vector3(0, 1, 0);
                light.intensity = 2;
                light.diffuse = new BABYLON.Color3(1, 1, 1);
                light.specular = new BABYLON.Color3(1, 1, 1);

                this.createModel();

                return scene;
            },
            createModel() {
                BABYLON.SceneLoader
                .ImportMeshAsync('', '/src/3d/', 'smartphone_two_textured.glb')
                .then((result) => {
                    result.meshes.forEach( (mesh, idx) => {
                        mesh.scaling = new BABYLON.Vector3(0.9, 0.9, 0.9);
                        if (mesh.material) {
                            this.mainMaterialLink = mesh.material;
                            this.meshes.push(mesh);
                        }
                    });    
                })
                .then(() => {
                    this.isAllScriptsFetched = true;
                    console.log('The entire model has been loaded');
                });
            },
            applyTextureByCode(attributeCode, optionCode) {
                this.imageBuffer = null;
                if (attributeCode === 'color') {
                    const isResetCustomCover = !!this.catchedTexture;
                    this.selectedColor = optionCode;
                    this.applyTexture(attributeCode);
                    if (!this.imageAttachment) this.applyTexture('skin');
                    if (isResetCustomCover) {
                        this.loadInputImage(null, true, 1);
                    }
                    return;
                }
                this.selectedSkin = optionCode;
                this.imageAttachment = null;
                this.catchedTexture = null;
                this.applyTexture(attributeCode);
            },
            applyTexture(attributeCode) {
                if (!this.mainMaterialLink || !this.meshes.length) return;
                const isColor = attributeCode === 'color';
                const src = isColor 
                    ? "/src/3d/smartphone/color_" + this.selectedColor + ".jpg"
                    : "/src/3d/smartphone/skin_" 
                        + (this.selectedSkin !== 'default' ? this.selectedSkin : this.selectedColor) 
                            + ".jpg";
                this.textureBuffer[attributeCode] = this.textureBuffer[attributeCode]
                    ? this.textureBuffer[attributeCode]
                    : document.createElement('img');
                this.textureBuffer[attributeCode].src = src;
                this.isTexturesLoading = true;
                this.textureBuffer[attributeCode].onload = this.checkAllImagesAreFetched.bind(this, isColor, src);
            },
            checkAllImagesAreFetched(isColor, src) {
                this.textureBufferFetchedNum = 0;
                this.handleMaterialMeshes(isColor, src);
                for (const key in this.textureBuffer) {
                    if (this.textureBuffer[key].complete) this.textureBufferFetchedNum++; 
                }
                if (this.textureBufferFetchedNum !== Object.keys(this.textureBuffer).length) return;
                this.rotateCameraTo(210);
                this.isTexturesLoading = false;
            },
            handleMaterialMeshes(skipFirstMaterial, src) {
                this.meshes.forEach((mesh, idx) => {
                    if (skipFirstMaterial ? idx === 0 : idx !== 0) return;
                    const newTexture = new BABYLON.Texture(src, mesh.getScene());
                    if (mesh.material instanceof BABYLON.PBRMaterial) {
                        mesh.material.albedoTexture = newTexture;
                    } else if (mesh.material instanceof BABYLON.StandardMaterial) {
                        mesh.material.diffuseTexture = newTexture;
                    }
                });
            },
            getResultByPercentage(percentage, totalNumber) {
                return Math.floor((percentage / 100) * totalNumber);
            },
            getPercentageByValues(part, fullValue) {
                return Math.floor((part * 100) / fullValue);
            },
            handleImageInputImagePosition() {
                this.loadInputImage(null, true);
            },
            handleImageInput() {
                if (this.imageInput && this.imageInputCanvas) return;
                this.imageInput = this.$el.querySelector("#load-image");
                this.imageInputCanvas = this.$el.querySelector("#fetch-image"); 
                if (!this.imageInputCanvas || !this.imageInput) return;
                this.imageInputCanvas.width = 512;
                this.imageInputCanvas.height = 1087;
                this.imageInput.addEventListener('change', this.loadInputImage.bind(this));
                this.handleInputCanvasImageControlls();
            },
            handleInputCanvasImageControlls() {
                let inputActive = false;
                let startX = 0;
                let startY = 0;
                let shiftXAccumulator = this.catchedTextureX || 0;
                let shiftYAccumulator = this.catchedTextureY || 0;
                const realWidth = this.imageInputCanvas.getBoundingClientRect().width;
                const realHeight = this.imageInputCanvas.getBoundingClientRect().height;
                const getClientCoords = (e) => {
                    if (e.touches && e.touches.length > 0) {
                        return {
                            x: e.touches[0].clientX,
                            y: e.touches[0].clientY
                        };
                    } else if (e.changedTouches && e.changedTouches.length > 0) {
                        return {
                            x: e.changedTouches[0].clientX,
                            y: e.changedTouches[0].clientY
                        };
                    }
                    return {
                        x: e.offsetX,
                        y: e.offsetY
                    };
                };
                const setStartingPoint = (e) => {
                    inputActive = true;
                    const coords = getClientCoords(e);
                    const rect = this.imageInputCanvas.getBoundingClientRect();
                    startX = coords.x - rect.left;
                    startY = coords.y - rect.top;
                };
                const breakStartingPoint = () => {
                    if (!inputActive) return;
                    inputActive = false;
                    startX = 0;
                    startY = 0;
                    shiftXAccumulator = this.catchedTextureX;
                    shiftYAccumulator = this.catchedTextureY;
                };
                const handleMove = (e) => {
                    if (!inputActive) return;
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    const rect = this.imageInputCanvas.getBoundingClientRect();
                    const coords = getClientCoords(e);
                    const currentX = coords.x - rect.left;
                    const currentY = coords.y - rect.top;
                    let diffX = this.getPercentageByValues(currentX - startX, realWidth * this.catchedTextureScale / 100);
                    let diffY = this.getPercentageByValues(currentY - startY, realHeight * this.catchedTextureScale / 100);
                    this.catchedTextureX = diffX + shiftXAccumulator;
                    this.catchedTextureY = diffY + shiftYAccumulator;
                };
                this.imageInputCanvas.addEventListener('mousedown', setStartingPoint.bind(this));
                this.imageInputCanvas.addEventListener('mouseup', breakStartingPoint.bind(this));
                this.imageInputCanvas.addEventListener('mouseleave', breakStartingPoint.bind(this));
                this.imageInputCanvas.addEventListener('mousemove', handleMove.bind(this));
                this.imageInputCanvas.addEventListener('touchstart', setStartingPoint.bind(this), { passive: false });
                this.imageInputCanvas.addEventListener('touchend', breakStartingPoint.bind(this));
                this.imageInputCanvas.addEventListener('touchcancel', breakStartingPoint.bind(this));
                this.imageInputCanvas.addEventListener('touchmove', handleMove.bind(this), { passive: false });
            },
            getBlueprintCover(callback) {
                if (this.imageBuffer) return this.imageBuffer;
                this.imageBuffer = document.createElement('img');
                this.imageBuffer.src = "/src/3d/smartphone/canvas_bg_" + this.selectedColor + ".jpg";
                return this.imageBuffer;
            },
            loadInputImage(e, isWatched, customTimeoutMs) {
                const file = e ? e.target.files[e.target.files.length - 1] : this.imageAttachment;
                if (!file) return;
                if (!isWatched) {
                    this.imageAttachment = file;
                    this.selectedSkin = null;
                }
                const ctx = this.imageInputCanvas.getContext("2d");
                const reader = new FileReader();
                const bgCover = this.getBlueprintCover();
                reader.onload = (e) => {
                    const base64 = e.target.result;
                    const img = new Image();
                    img.onload = () => {
                        ctx.clearRect(0, 0, this.imageInputCanvas.width, this.imageInputCanvas.height);
                        ctx.drawImage(bgCover, 0, 0, this.imageInputCanvas.width, this.imageInputCanvas.height);
                        const scaleFactor = this.catchedTextureScale / 100;
                        const canvasWidth = this.imageInputCanvas.width;
                        const canvasHeight = this.imageInputCanvas.height;
                        const proportion = img.width / img.height;
                        let imgWidth = img.width;
                        let imgHeight = img.height;
                        imgHeight = canvasHeight * scaleFactor;
                        imgWidth = Math.floor(imgHeight * proportion);

                        const shiftX = this.getResultByPercentage(this.catchedTextureX, imgWidth);
                        const shiftY = this.getResultByPercentage(this.catchedTextureY, imgHeight);
                        ctx.save();
                        ctx.translate(shiftX, shiftY);
                        const centerX = imgWidth / 2;
                        const centerY = imgHeight / 2;
                        ctx.translate(centerX, centerY);
                        ctx.rotate(this.catchedTextureRotate * Math.PI / 180);
                        ctx.translate(-centerX, -centerY);
                        ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                        ctx.restore();
                        if (isWatched) {
                            clearTimeout(this.applyingTimeout);
                            this.applyingTimeout = setTimeout(() => {
                                this.handleInputImageTexture(isWatched);
                                this.applyingTimeout = null;
                            }, customTimeoutMs ? customTimeoutMs : this.applyingDebounceMs);
                        } else {
                            this.handleInputImageTexture();
                        }
                    };
                    img.src = base64;
                };
                reader.readAsDataURL(file);
            },
            handleInputImageTexture(isWatched) {
                if (!this.mainMaterialLink || !this.meshes.length || (isWatched && !this.catchedTexture)) return;
                const dataURL = this.imageInputCanvas.toDataURL('image/png');
                if (isWatched) {
                    this.catchedTexture.updateURL(dataURL);
                    return;
                }
                const textureId = "extCanvasTex_" + Date.now();
                this.catchedTexture = BABYLON.Texture.CreateFromBase64String(dataURL, textureId, this.scene, true, false);
                /*
                this.catchedTexture.uOffset = this.catchedTextureX / 100; 
                this.catchedTexture.vOffset = this.catchedTextureY / 100;
                this.catchedTexture.uScale = this.catchedTextureScaleX / 100;
                this.catchedTexture.vScale = this.catchedTextureScaleY / 100;;
                this.catchedTexture.wAng = this.catchedTextureRotate * (Math.PI / 180);
                */
                this.catchedTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                this.catchedTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                this.meshes.forEach((mesh, idx) => {
                    if (idx !== 0) return;
                    const mat = mesh.material;
                    if (mat && mat.getClassName && mat.getClassName() === "PBRMetallicRoughnessMaterial") {
                        mat.baseTexture = this.catchedTexture;
                    } else if (mat instanceof BABYLON.PBRMaterial) {
                        mat.albedoTexture = this.catchedTexture;
                    } else if (mat instanceof BABYLON.StandardMaterial) {
                        mat.diffuseTexture = this.catchedTexture;
                    }
                });
                if (!isWatched) this.rotateCameraTo(210);
            },
            rotateCameraTo(targetAlphaDegrees) {
                const targetAlpha = targetAlphaDegrees * (Math.PI / 180);
                let observer = null;
                const stopAnimationOnInteraction = () => {
                    if (observer) {
                        this.scene.onBeforeRenderObservable.remove(observer);
                        observer = null;
                    }
                    this.canvas.removeEventListener("pointerdown", stopAnimationOnInteraction);
                    this.canvas.removeEventListener("wheel", stopAnimationOnInteraction);
                };
                this.canvas.addEventListener("pointerdown", stopAnimationOnInteraction);
                this.canvas.addEventListener("wheel", stopAnimationOnInteraction);
                observer = this.scene.onBeforeRenderObservable.add(() => {
                    this.camera.alpha = BABYLON.Scalar.Lerp(this.camera.alpha, targetAlpha, 0.05);
                    if (Math.abs(this.camera.alpha - targetAlpha) < 0.001) {
                        this.camera.alpha = targetAlpha;
                        stopAnimationOnInteraction(); 
                    }
                });
            }
        }
    }
}
$ez.setComponent(BabylonRender);
