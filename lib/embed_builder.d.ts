import { ChattyHostConnection, CallbackStore } from '@looker/chatty';
import { EmbedClient } from './embed';
import { LookerEmbedEventMap, LookerEmbedFilterParams } from './types';
declare type EmbedClientConstructor<T> = {
    new (host: ChattyHostConnection): T;
};
interface LookerEmbedHostSettings {
    apiHost: string;
    authUrl?: string;
}
interface UrlParams {
    [key: string]: string;
}
/**
 * The builder class for [EmbedClient]. Contains methods for defining the properties of embedded
 * Looker content.
 */
export declare class EmbedBuilder<T> {
    private _hostSettings;
    private _type;
    private _clientConstructor;
    private _handlers;
    private _appendTo;
    private _sandboxAttrs;
    private _classNames;
    private _frameBorder;
    private _id?;
    private _params;
    private _url?;
    /**
     * @hidden
     */
    constructor(_hostSettings: LookerEmbedHostSettings, _type: string, _clientConstructor: EmbedClientConstructor<T>);
    /**
     * Value for the `frame-border` attribute of an embedded iframe
     */
    withFrameBorder(attr: string): this;
    /**
     * @hidden
     *
     * @param id
     */
    withId(id: number | string): this;
    /**
     * Allows manual control of URL parameters for the embedded content
     *
     * @param params Additional URL parameters
     * created by ID.
     */
    withParams(params: UrlParams): this;
    /**
     * Allows specifying initial filters to apply to the embedded content.
     *
     * @filters Filters to apply
     */
    withFilters(filters: LookerEmbedFilterParams, escape?: boolean): this;
    /**
     * Allows specifying sandbox attributes for an embedded content iframe. Sandbox attributes
     * should include `allow-scripts` or embedded content will not execute.
     * @param attr one or more sandbox attributes for an embedded content iframe.
     */
    withSandboxAttr(...attr: string[]): this;
    /**
     * Allows specifying classes for an embedded content
     * @param className one or more sandbox attributes for an embedded content.
     */
    withClassName(...className: string[]): this;
    /**
     * Allows specifying a theme for the content.
     * *
     * @param theme Theme name
     */
    withTheme(theme: string): this;
    /**
     * @hidden
     *
     * @param url
     */
    withUrl(url: string): this;
    /**
     * The element to append the embedded content to.
     */
    readonly el: HTMLElement;
    /**
     * the frame-border attribute to apply to the iframe
     */
    readonly frameBorder: string;
    /**
     * The type of embedded content, dashboard, look, and explore
     */
    readonly type: string;
    /**
     * The address of the Looker instance being used
     */
    readonly apiHost: string;
    /**
     * The content URL of this embedded content, if provided
     */
    readonly url: string | null | undefined;
    /**
     * The auth URL of this embedded content, if provided
     */
    readonly authUrl: string | undefined;
    /**
     * @hidden
     */
    readonly embedUrl: string;
    /**
     * @hidden
     */
    readonly handlers: CallbackStore;
    /**
     * The sandbox attributes of an embedded content iframe, if provided
     */
    readonly sandboxAttrs: string[];
    /**
     * The classnames to apply to the embedded content
     */
    readonly classNames: string[];
    /**
     * The ID of this embedded content, if provided
     */
    readonly id: string | number | undefined;
    /**
     * @hidden
     */
    readonly clientConstructor: EmbedClientConstructor<T>;
    /**
     * Select an element to append the embedded content to, either a content selector or
     * the DOM element.
     *
     * @param el
     */
    appendTo(el: HTMLElement | string): this;
    /**
     * Register an event handler.
     *
     * @typeparam K A Looker embed event name
     * @param name: string Name of the event to respond to.
     * @param handler: Callback A callback method to be invoked when the message is received.
     */
    on<K extends keyof LookerEmbedEventMap>(name: K, handler: (params: LookerEmbedEventMap[K]) => any): this;
    /**
     * Constructs the embedded content, including creating the DOM element that contains the content.
     */
    build(): EmbedClient<T>;
}
export {};
