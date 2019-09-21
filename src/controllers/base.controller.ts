import config from '../config';

export class BaseController {
  generateLinks = (pagination, router, querystring) => {
    const { limit, offset: currentOffset, total } = pagination;
    const nextOffset = (currentOffset + 1) * limit < total ? currentOffset + 1 : currentOffset;
    const prevOffset = currentOffset > 0 ? currentOffset - 1 : currentOffset;
    const next = `${config.server.entrypoint}${router}?limit=${limit}&offset=${nextOffset}&${querystring}`;
    const prev = `${config.server.entrypoint}${router}?limit=${limit}&offset=${prevOffset}&${querystring}`;
    return { links: { next, prev } };
  };
}
