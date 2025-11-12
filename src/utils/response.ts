export type Response<T> = {
    status: number;
    message: string;
    pagination?: {
        limit: number;
        page: number;
        total: number;
        lastPage: number;
    };
    totalCostOfInventory?: number;
    totalPriceOfInventory?: number;
    data: T;
};