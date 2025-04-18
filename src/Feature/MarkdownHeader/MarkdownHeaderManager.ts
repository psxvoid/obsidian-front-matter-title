import AbstractManager from "@src/Feature/AbstractManager";
import { Feature, Leaves } from "@src/Enum";
import { inject, injectable, named } from "inversify";
import EventDispatcherInterface from "@src/Components/EventDispatcher/Interfaces/EventDispatcherInterface";
import { AppEvents } from "@src/Types";
import SI from "@config/inversify.types";
import ListenerRef from "@src/Components/EventDispatcher/Interfaces/ListenerRef";
import ObsidianFacade from "@src/Obsidian/ObsidianFacade";
import { MarkdownViewExt } from "obsidian";
import LoggerInterface from "@src/Components/Debug/LoggerInterface";

@injectable()
export class MarkdownHeaderManager extends AbstractManager {
    private ref: ListenerRef<"layout:change"> = null;
    private enabled = false;

    constructor(
        @inject(SI["event:dispatcher"])
        private dispatcher: EventDispatcherInterface<AppEvents>,
        @inject(SI["facade:obsidian"])
        private facade: ObsidianFacade,
        @inject(SI.logger)
        @named(`manager:${MarkdownHeaderManager.getId()}`)
        private logger: LoggerInterface
    ) {
        super();
    }

    static getId(): Feature {
        return Feature.Header;
    }

    getId(): Feature {
        return MarkdownHeaderManager.getId();
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    protected doDisable(): void {
        this.dispatcher.removeListener(this.ref);
        this.facade.getViewsOfType<MarkdownViewExt>(Leaves.MD).forEach(this.revert.bind(this));
        this.enabled = false;
    }

    protected doEnable(): void {
        this.ref = this.dispatcher.addListener({
            name: "layout:change",
            cb: () => this.refresh().catch(console.error),
        });
        this.enabled = true;
    }

    protected async doRefresh(): Promise<{ [p: string]: boolean }> {
        await this.innerUpdate();
        return Promise.resolve({});
    }

    protected async doUpdate(path: string): Promise<boolean> {
        return this.innerUpdate(path);
    }

    private async innerUpdate(path: string = null): Promise<boolean> {
        const views = this.facade.getViewsOfType<MarkdownViewExt>(Leaves.MD);
        let updated = false;
        for (const view of views) {
            if (view.file && (!path || view.file.path === path)) {
                const title = this.resolver.resolve(view.file.path);
                this.setTitle(view, title);
                updated = true;
            }
        }

        return updated;
    }

    private setTitle(view: MarkdownViewExt, title: string | null): void {
        this.logger.log(`Set title "${title ?? " "}" for ${view.file.path}`);
        const container = view.titleContainerEl as HTMLDivElement;

        if (!title) {
            return this.revert(view);
        }

        let el = this.findExistingFakeEl(container);

        if (title && el && el.innerText === title && !el.hidden) {
            return this.logger.log(`Set title "${title}" for ${view.file.path} is skipped`);
        }

        el = el ?? this.createFakeEl(title, view);
        el.innerText = title;
        el.hidden = false;
        view.titleEl.hidden = true;
    }

    private revert(view: MarkdownViewExt): void {
        if (!view.file) {
            return;
        }
        const container = view.titleContainerEl as HTMLDivElement;
        const el = this.findExistingFakeEl(container);
        if (el) {
            container.removeChild(el);
        }
        view.titleEl.hidden = false;
        return;
    }

    private findExistingFakeEl(container: HTMLElement): HTMLDivElement | null {
        for (const i of Array.from(container.children)) {
            if (i.hasAttribute("data-ofmt") && i instanceof HTMLDivElement) {
                return i;
            }
        }
        return null;
    }

    private createFakeEl(title: string, view: MarkdownViewExt): HTMLDivElement {
        const el = document.createElement("div");
        el.className = "view-header-title";
        el.dataset["ofmt"] = "true";
        el.innerText = title;
        el.hidden = true;
        el.onclick = () => {
            el.hidden = true;
            view.titleEl.hidden = false;
            view.titleEl.focus();
            view.titleEl.onblur = () => {
                view.titleEl.hidden = true;
                el.hidden = false;
            };
        };
        (view.titleContainerEl as HTMLDivElement).appendChild(el);
        return el;
    }
}
