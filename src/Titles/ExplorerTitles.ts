import {TAbstractFile, TFile, TFileExplorer, TFileExplorerItem} from "obsidian";
import FileTitleResolver from "../FileTitleResolver";

export default class ExplorerTitles {
	private originTitles = new Map<string, string>();

	constructor(
		private explorer: TFileExplorer,
		private resolver: FileTitleResolver
	) {
	}

	public async updateTitle(abstract: TAbstractFile): Promise<void> {
		const item = this.explorer.fileItems[abstract.path];
		if (item) {
			await this.setTitle(item);
		}
	}

	private async setTitle(item: TFileExplorerItem): Promise<void> {

		const title = await this.resolver.resolve(item.file);
		if (this.isTitleEmpty(title)) {
			if (this.originTitles.has(item.file.path)) {
				return this.restore(item);
			}
		}else if (item.titleEl.innerText !== title) {
			this.keepOrigin(item);
			item.titleEl.innerText = title;
		}
	}

	private isTitleEmpty = (title: string): boolean => title === null || title === '';

	private keepOrigin(item: TFileExplorerItem): void {
		if (!this.originTitles.has(item.file.path)) {
			this.originTitles.set(item.file.path, item.titleEl.innerText);
		}
	}

	public async initTitles(): Promise<void> {
		const promises = [];
		for (const item of Object.values(this.explorer.fileItems)) {
			promises.push(this.setTitle(item));
		}
		await Promise.all(promises);
	}

	public restoreTitles(): void {
		Object.values(this.explorer.fileItems).map(e => this.restore(e));
	}

	private restore(item: TFileExplorerItem): void {
		if (this.originTitles.has(item.file.path)) {
			item.titleEl.innerText = this.originTitles.get(item.file.path);
		}
	}
}
