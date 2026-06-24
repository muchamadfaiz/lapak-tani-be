export interface PageMetaDtoParams {
  page: number;
  limit: number;
  totalData: number;
}

export class PageMetaDto {
  readonly itemPerPage: number;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalData: number;

  constructor({ page, limit, totalData }: PageMetaDtoParams) {
    this.currentPage = page;
    this.itemPerPage = limit;
    this.totalData = totalData;
    this.totalPages = Math.ceil(totalData / limit);
  }
}
