import { EmbedBuilder } from './embed_builder';
import { LookerEmbedDashboard } from './dashboard_client';
import { LookerEmbedExplore } from './explore_client';
import { LookerEmbedLook } from './look_client';
export { LookerEmbedDashboard } from './dashboard_client';
export { LookerEmbedExplore } from './explore_client';
export { LookerEmbedLook } from './look_client';
export declare class LookerEmbedSDK {
    static init(apiHost: string, authUrl?: string): void;
    /**
     * Create an EmbedBuilder for an embedded Looker dashboard.
     *
     * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
     */
    static createDashboardWithUrl(url: string): EmbedBuilder<LookerEmbedDashboard>;
    /**
     * Create an EmbedBuilder for an embedded Looker dashboard.
     *
     * @param id The numeric ID of a Looker User Defined Dashboard, or LookML Dashboard ID
     */
    static createDashboardWithId(id: string | number): EmbedBuilder<LookerEmbedDashboard>;
    /**
     * Create an EmbedBuilder for an embedded Looker Explore.
     *
     * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
     */
    static createExploreWithUrl(url: string): EmbedBuilder<LookerEmbedExplore>;
    /**
     * Create an EmbedBuilder for an embedded Looker Explore.
     *
     * @param id The ID of a Looker explore
     */
    static createExploreWithId(id: string): EmbedBuilder<LookerEmbedExplore>;
    /**
     * Create an EmbedBuilder for an embedded Looker Look.
     *
     * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
     */
    static createLookWithUrl(url: string): EmbedBuilder<LookerEmbedLook>;
    /**
     * Create an EmbedBuilder for an embedded Looker dashboard.
     *
     * @param id The ID of a Looker Look
     */
    static createLookWithId(id: number): EmbedBuilder<LookerEmbedLook>;
    /**
     * @hidden
     */
    static apiHost: string;
    /**
     * @hidden
     */
    static authUrl?: string;
}
