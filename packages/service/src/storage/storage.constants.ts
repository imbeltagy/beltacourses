/** BullMQ queue that carries the cleanup job. */
export const STORAGE_CLEANUP_QUEUE = 'storage-cleanup';

/** Repeatable-job id and cron pattern — Sunday 00:00. */
export const STORAGE_CLEANUP_SCHEDULER_ID = 'storage-weekly-cleanup';
export const STORAGE_CLEANUP_CRON = '0 0 * * 0';

/**
 * Rows fetched per page inside one cleanup run. The run keeps paging until every
 * soft-deleted file is gone.
 */
export const STORAGE_CLEANUP_PAGE_SIZE = 100;
