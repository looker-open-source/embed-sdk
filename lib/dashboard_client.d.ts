import { LookerEmbedFilterParams } from './types';
import { LookerEmbedBase } from './embed_base';
/**
 * Client that communicates with an embedded Looker dashboard. Messages are documented
 * [here](https://docs.looker.com/r/sdk/events)
 */
export declare class LookerEmbedDashboard extends LookerEmbedBase {
    /**
     * Convenience method for sending a run message to the embedded dashboard.
     */
    run(): void;
    /**
     * Convenience method for updating the filters of the embedded dashboard.
     *
     * @param filters A set of filter parameters to update
     */
    updateFilters(params: LookerEmbedFilterParams): void;
}
