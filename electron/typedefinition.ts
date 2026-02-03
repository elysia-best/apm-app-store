export interface InstalledAppInfo {
    pkgname: string;
    version: string;
    arch: string;
    flags: string;
    raw: string;
}


export type ChannelPayload = {
    success: boolean;
    message: string;
    [k: string]: unknown;
};