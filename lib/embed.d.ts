import { EmbedBuilder } from './embed_builder';
import { ChattyHost, ChattyHostBuilder } from '@looker/chatty';
/**
 * Wrapper for Looker embedded content. Provides a mechanism for creating the embedded content element,
 * and for establishing two-way communication between the parent window and the embedded content.
 */
export declare class EmbedClient<T> {
    private _builder;
    _hostBuilder: ChattyHostBuilder | null;
    _host: ChattyHost | null;
    _connection: Promise<T> | null;
    /**
     * @hidden
     */
    constructor(_builder: EmbedBuilder<T>);
    /**
     * Returns a promise that resolves to a client that can be used to send messages to the
     * embedded content.
     */
    readonly connection: Promise<T> | null;
    /**
     * Indicates whether two way communication has successfully been established with the embedded content.
     */
    readonly isConnected: boolean;
    private createIframe;
    private createUrl;
    /**
     * Establish two way communication with embedded content. Returns a promise that resolves to a
     * client that can be used to send messages to the embedded content.
     */
    connect(): Promise<T>;
}
