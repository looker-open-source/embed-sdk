import { ChattyHostConnection } from '@looker/chatty';
export declare class LookerEmbedBase {
    private _host;
    /**
     * @hidden
     *
     * @param _host
     */
    constructor(_host: ChattyHostConnection);
    /**
     * Send a message to the embedded Explore.
     *
     * @param message String message identifier.
     * @param params Additional parameters to be sent to the client. After transmission ownership
     * of the parameters is transferred to the embedded Explore.
     */
    send(message: string, params?: any): void;
}
