import { PageMetaDto } from './page-meta.dto';

export class PageLinksDto {
  readonly first: string | null;
  readonly last: string | null;
  readonly next: string | null;
  readonly prev: string | null;

  constructor(path: string, meta: PageMetaDto, limit: number) {
    const buildUrl = (page: number) => `${path}?page=${page}&limit=${limit}`;

    this.first = meta.totalData > 0 ? buildUrl(1) : null;
    this.last = meta.totalPages > 0 ? buildUrl(meta.totalPages) : null;
    this.next =
      meta.currentPage < meta.totalPages
        ? buildUrl(meta.currentPage + 1)
        : null;
    this.prev =
      meta.currentPage > 1 ? buildUrl(meta.currentPage - 1) : null;
  }
}
