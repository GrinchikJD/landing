class Header extends EzAlpineHTMLElement {

    ALPINE_COMPONENT_KEY = 'initHeaderComponent';

    ELEMENT_ATTRIBUTES = [
        { 'class' : 'flex items-center w-full justify-between' }
    ];

    drawMenuIconBySrcAndCondition(src, condition) {
        return /*html*/`
        <img class="absolute" src="${src}" width="28" height="28" alt="Menu" loading="lazy" 
            x-bind:style="${condition}
            ? 'animation: fadeInRotation 0.2s ease-out forwards;' 
            : 'animation: fadeOutRotation 0.2s ease-out forwards;'"/>
        `
    }

    EZ_HTML = ($) => /*html*/`
    <nav role="navigation" class="flex items-center my-auto max-md:absolute left-0 max-md:w-full z-50
        text-xl md:text-base transition-all max-md:-translate-x-full duration-200"
        :class="{ 'max-md:translate-x-0 js-menu-opened' : isMobileOpened, 
                'max-md:-translate-x-full' : !isMobileOpened }"
        @hook-backdrop-disable.window="isMobileOpened = false"
    >
        <ul class="flex flex-col max-md:gap-4 md:flex-row md:items-center max-md:w-full
            max-md:py-4 max-md:absolute max-md:top-4"
        >
            <template x-for="(item, idx) in menuArr">
                <li class="max-md:ml-11 px-2 mx-2" :class="{ 'max-md:hidden' : selectedIdx === idx }">
                    <a  x-bind:href="item.url"
                        :class="{
                            'selected text-white' : selectedIdx === idx,
                            'text-gray-400' : selectedIdx !== idx,
                        }"
                        class="menu-tab text-gray-400"
                    >
                        <span class="text capitalize" x-text="item.title"></span>
                    </a>
                </li>
            </template>
        </ul>
    </nav>
    <button class="flex items-center gap-4 md:hidden p-2 z-50 text-xl" title="Toggle menu"
        @click="toggleMenu()">
        <div class="w-7 aspect-square min-w-7 flex items-center justify-center">
            ${this.drawMenuIconBySrcAndCondition('/src/svg/menu.svg', '!isMobileOpened')}
            ${this.drawMenuIconBySrcAndCondition('/src/svg/cross.svg', 'isMobileOpened')}
        </div>
        <span class="capitalize" 
            x-text="menuArr[selectedIdx]?.title || breadCrumbs[breadCrumbs.length-1]?.title"></span>
    </button>
    <div class="ml-auto z-50"></div>
    <template x-if="breadCrumbs.length">
        <div class="breadcrumbs px-3 md:px-4 text-xs text-gray-400 flex gap-2 z-10"
            :class="{ '-translate-x-full' : isMobileOpened }"
        >
            <template x-for="(item, idx) in breadCrumbs" :key="idx">
                <a :href="item.url || ''" class="capitalize"
                    :class="{ 'text-white' : item.url, 'next-crumb' : idx, 'pointer-events-none': !item.url }"
                    :title="item.title + ' link'" x-text="item.title"></a>
            </template>
        </div>
    </template>
    `

    initHeaderComponent($) {
        return {
            selectedIdx: null,
            header: null,
            ahchor: null,
            isScrolled: false,
            isMobileOpened: false,
            pageTitle: null,
            menuArr: [
                {title: 'Showcase', url:'/'},
                {title: 'Contact Me', url:'/zpages/contact.html'}
            ],
            breadCrumbs: [],
            init(){
                this.handleActiveMenu();
                this.initStickyHeader();
                this.handleWindowScroll();
            },
            toggleMenu() {
                this.isMobileOpened = !this.isMobileOpened;
                window.dispatchEvent(new CustomEvent('backdrop-toggle'));
            },
            handleActiveMenu() {
                let strPath = window.location.pathname.split('/');
                    strPath = strPath[strPath.length-1];
                this.setBreadcrumbLink(strPath);
                if (!strPath) {
                    this.selectedIdx = 0;
                    return;
                }
                this.menuArr.forEach( (elem, idx) => {
                    if (elem.url.indexOf(strPath) >= 0) {
                        this.selectedIdx = idx;
                    }
                });
                if (this.selectedIdx || typeof this.selectedIdx === 'number') return;
            },
            setBreadcrumbLink(strPath) {
                if (!strPath) return;
                this.pageTitle = this.pageTitle 
                    ? this.pageTitle 
                    : document.head.querySelector('title');
                const title = this.pageTitle 
                    ? this.pageTitle.innerText 
                    : strPath.split('.')[0].replace(/_/gi, ' ');
                this.breadCrumbs.push({title: "Home", url: '/'});
                this.breadCrumbs.push({title: (title), url: ''});
            },
            initStickyHeader() {
                this.header = document.querySelector("header");
                this.anchor = document.createElement('div');
                this.anchor.className = 'header-anchor';
                this.anchor.style.width = '100%';
                document.body.prepend(this.anchor);
            },
            handleWindowScroll(e) {
                if (!this.header || !this.anchor) return;
                const observer = new IntersectionObserver(([entry]) => {
                    this.isScrolled = !entry.isIntersecting;
                    this.checkIsScrolledStatus();
                }, { threshold: 0 });
                observer.observe(this.anchor);
            },
            checkIsScrolledStatus() {
                this.header.classList[(this.isScrolled ? 'add' : 'remove')]('is-sticky')
            }
        }
    }
}
$ez.setComponent(Header);
