class Skills extends EzAlpineHTMLElement {

    ALPINE_COMPONENT_KEY = 'initSkillsComponent';

    SLIDES = [
        { 
            title: "Magento 2", logo: '/src/svg/logos/magento.svg',
            subtitle: "E-Commerce Platform"
        },
        { 
            title: "Hyvä Theme", logo: '/src/svg/logos/hyva.svg'
        },
        { 
            title: "Alpine.js", logo: '/src/svg/logos/alpinejs.svg'
        },
        { 
            title: "Tailwindcss", logo: '/src/svg/logos/tailwindcss.svg'
        },
        { 
            title: "Playwright", logo: '/src/svg/logos/playwright.svg'
        },
        { 
            title: "WebTutor", logo: '/src/svg/logos/webtutor.svg',
            subtitle: "E-Learning Platform"
        },
        { 
            title: "Babylon.js", logo: '/src/svg/logos/babylonjs.svg'
        },
        { 
            title: "Blender", logo: '/src/svg/logos/blender.svg'
        },
        { 
            title: "Unity", logo: '/src/svg/logos/unity.svg'
        },
        { 
            title: "Photoshop", logo: '/src/svg/logos/photoshop.svg'
        },
        {
            title: "Paint.NET", logo: '/src/svg/logos/paintnet.svg'
        },
    ];

    ELEMENT_ATTRIBUTES = [
        { 'class' : 'flex items-center -mx-4 px-4 bg-theme-50 shadow-lg' }
    ];

    SLIDER_BUTTON_CLASS = `rounded-full aspect-suqare w-6 min-w-6 bg-white text-theme flex items-center justify-center
        transition-color duration-200 hover:bg-accent absolute z-10`;

    drawSvgWithAdditionalClass = (additionalClass) => {
        return /*html*/`
        <svg class="w-4 min-w-4 aspect-square ${additionalClass}"
            height="24" width="24" viewBox="0 50 200 200" xmlns="http://www.w3.org/2000/svg">
            <polygon points="100,90 180,180 20,180" fill="currentColor" stroke="currentColor" stroke-width="4" />
        </svg> 
        `
    }

    drawImageByItem = (item) => {
        return !item.logo ? '' : /*html*/`
        <div class="aspect-square w-[32px] p-1 rounded-md bg-white flex items-center justify-center">
            <img src="${item.logo}" alt="${item.title} logo" height="28" width="28" loading="lazy" />
        </div>
        `
    }

    drawSubtitleByItem = (item) => {
        return !item.subtitle ? '' : /*html*/`
            <code class="text-xs leading-[12px]">${item.subtitle}</code>
        `
    }

    EZ_HTML = ({autorotation, waittime}) => /*html*/`
    <div @mouseenter="handleHover()" @mouseleave.self="handleRelease()"
        @resize.window.debounce.150ms="recalculate"
        x-bind:injectdata="(autoRotation = ${autorotation}) 
            && (waitTime = ${waittime})"
        class="text-white w-full max-w-full flex items-center gap-8 md:gap-12 my-auto">
        <span class="font-heading text-lg md:text-xl font-bold">My experience:</span>
        <div class="flex-grow w-1/2 flex items-center relative">
            <button class="${this.SLIDER_BUTTON_CLASS} left-0 -translate-x-1/2"
                title="Previous slide"
                @click.debounce.150ms="prevSlide()">
                ${this.drawSvgWithAdditionalClass('rotate-[270deg]')}   
            </button>
            <div class="w-full max-w-full relative flex-none overflow-hidden">
                <div x-ref="slides" class="js-slides-row overflow-auto relative flex flex-nowrap
                    scroll-smooth snap-x snap-mandatory w-full no-scrollbar"
                >
                    ${this.SLIDES.map(item => /*html*/`
                        <div class="js-slide flex w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 shrink-0 snap-start
                             cursor-pointer group py-4 justify-center">
                            <a href="/zpages/experience.html"
                                title="Checkout my ${item.title} experience!"
                                class="flex items-center gap-2 pl-6 pr-8 sm:px-4 transition-transform duration-200 
                                    group-hover:scale-105 text-shadow-md">
                                ${this.drawImageByItem(item)}
                                <div class="flex flex-col">
                                    <span class="font-heading text-sm">${item.title}</span>
                                    ${this.drawSubtitleByItem(item)}
                                </div>
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button class="${this.SLIDER_BUTTON_CLASS} right-2" 
                title="Next slide"
                @click.debounce.150ms="nextSlide()">
                ${this.drawSvgWithAdditionalClass('rotate-90')}   
            </button>
        </div>
    </div>
    `

    initSkillsComponent($) {
        return {
            currentSlide: 0,
            slideWidth: 0,
            slidesNum: 0,
            slidesOnPage: 0,
            lastIdx: 0,
            autoRotation: 0,
            waitTime: 0,
            isHovered: false,
            init() {
                this.$nextTick(this.recalculate.bind(this));
                this.$nextTick(this.handleAutoRotation.bind(this));
            },
            handleHover() {
                this.isHovered = true;
            },
            handleRelease() {
                this.isHovered = false;
            },
            handleAutoRotation() {
                if (!this.autoRotation) return;
                setTimeout(() => {
                    this.handleAutoRotation();
                    if (this.isHovered) return;
                    this.nextSlide();
                }, this.waitTime * 1000);
            },
            recalculate() {
                if (!this.$refs.slides) return;
                const slides = this.$refs.slides.querySelectorAll(".js-slide");
                if (!slides.length) return;
                this.slideWidth = slides[0].offsetWidth;
                this.slidesNum = slides.length;
                this.slidesOnPage = Math.round(this.$refs.slides.offsetWidth / this.slideWidth);
                this.lastIdx = this.slidesNum - this.slidesOnPage;
                this.currentSlide = 0;
                this.goToSlideByIndex(0);
            },
            nextSlide() {
                this.currentSlide = this.currentSlide >= this.lastIdx 
                    ? 0 
                    : this.currentSlide + (1  * this.slidesOnPage);
                this.goToSlideByIndex(this.currentSlide);
            },
            prevSlide() {
                this.currentSlide = this.currentSlide <= 0 
                    ? this.lastIdx
                    : this.currentSlide - (1  * this.slidesOnPage);
                this.goToSlideByIndex(this.currentSlide);
            },
            goToSlideByIndex(idx) {
                if (!this.$refs.slides) return;
                this.$refs.slides.scrollLeft = idx * this.slideWidth;
            }
        }
    }
}
$ez.setComponent(Skills);
