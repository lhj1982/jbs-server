import { Request, Response, NextFunction } from 'express';
import ReportService from '../services/report.service';
import { BaseController } from './base.controller';
import { InvalidRequestException } from '../exceptions/custom.exceptions';
import config from '../config';

export class ReportsController extends BaseController {
  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    const { shopName, fromDate, toDate } = req.query;
    let offset = parseInt(req.query.offset);
    let limit = parseInt(req.query.limit);
    if (!offset) {
      offset = config.query.offset;
    }
    if (!limit) {
      limit = config.query.limit;
    }
    if (!shopName || !fromDate || !toDate) {
      next(new InvalidRequestException('Report', ['shopName', 'fromDate', 'toDate']));
      return;
    }
    try {
      let result = await ReportService.getOrders(shopName, fromDate, toDate, limit, offset);
      const links = this.generateLinks(result.pagination, req.route.path, '');
      result = Object.assign({}, result, links);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    const { shopName, fromDate, toDate } = req.query;
    let offset = parseInt(req.query.offset);
    let limit = parseInt(req.query.limit);
    if (!offset) {
      offset = config.query.offset;
    }
    if (!limit) {
      limit = config.query.limit;
    }
    if (!shopName || !fromDate || !toDate) {
      next(new InvalidRequestException('Report', ['shopName', 'fromDate', 'toDate']));
      return;
    }
    try {
      let result = await ReportService.getEvents(shopName, fromDate, toDate, limit, offset);
      const links = this.generateLinks(result.pagination, req.route.path, '');
      result = Object.assign({}, result, links);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
