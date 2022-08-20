export type SettingsManagersType = 'graph' | 'explorer' | 'header' | 'quick_switcher'
export type SettingsType = {
    templates: string[],
    rules: {
        paths: { mode: 'black' | 'white', values: string[] },
        delimiter: {enabled: boolean, value: string},
    },
    managers: { [k in SettingsManagersType]: boolean },
    debug: boolean,
    boot: {
        delay: number
    }
};

export type SettingsEvent = {
    'settings.changed': { old: SettingsType, actual: SettingsType },
    'settings.loaded': { settings: SettingsType }
}