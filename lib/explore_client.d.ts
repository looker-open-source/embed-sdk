import { LookerEmbedFilterParams } from './types';
import { LookerEmbedBase } from './embed_base';
/**
 * Client that communicates with an embedded Looker Explore. Messages are documented
 * [here](https://docs.looker.com/r/sdk/events)
 */
export declare class LookerEmbedExplore extends LookerEmbedBase {
    /**
     * Convenience method for sending a run message to the embedded Explore.
     */
    run(): void;
    /**
     * Convenience method for updating the filters of the embedded Explore.
     *
     * @param filters A set of filter parameters to update
     */
    updateFilters(params: LookerEmbedFilterParams): void;
}
