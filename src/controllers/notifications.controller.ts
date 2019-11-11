import { Request, Response, NextFunction } from 'express';
import { string2Date } from '../utils/dateUtil';
import { pp } from '../utils/stringUtil';
import logger from '../utils/logger';
import NotificationsRepo from '../repositories/notifications.repository';
import { BaseController } from './base.controller';
import config from '../config';

export class NotificationsController extends BaseController {
  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let offset = parseInt(req.query.offset);
      let limit = parseInt(req.query.limit);
      const { audience } = req.query;
      if (!offset) {
        offset = config.query.offset;
      }
      if (!limit) {
        limit = config.query.limit;
      }
      let result = await NotificationsRepo.find({ offset, limit, audience});
      const links = this.generateLinks(result.pagination, req.route.path, 'audience=' + audience);
      result = Object.assign({}, result, links);
      res.json(result);
    } catch (err) {
      res.send(err);
    }
  };

  /**
   * Get message status report pushed by vendor.
   * report example is
   * reports=180828100924138386,13912345678,0, DELIVRD, 00000020140805135416, 20181125112640; 180828100924138386,13912345678,0, DELIVRD, 00000020140805135416, 20181125112640
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  getSmsSendReports = async (req: Request, res: Response, next: NextFunction) => {
    const { reports } = req.body;
    logger.info(`Receive message status report, data: ${reports}`);
    const reportsItems = reports.split(';');
    const sendReports = this.generateSendReports(reportsItems);
    // console.log(sendReports);
    let notification = undefined;
    let foundNotification = 0;
    if (sendReports) {
      for (let i = 0; i < sendReports.length; i++) {
        const report = sendReports[i];
        const { taskid } = report;
        notification = await NotificationsRepo.findByTaskId(taskid);
        if (notification) {
          foundNotification = 1;
          break;
        }
      }
      if (!foundNotification) {
        logger.warn(`No notification is found, taskid: ${pp(sendReports)}`);
      } else {
        const notificationToUpdate = Object.assign(notification.toObject(), {
          reports: sendReports
        });
        await NotificationsRepo.saveOrUpdate(notificationToUpdate);
        const { taskid } = notification;
        logger.info(`Update notification status succeed, taskid: ${taskid}`);
      }
    }
    res.json({ code: 'SUCCESS' });
  };

  getNotification = async (req: Request, res: Response, next: NextFunction) => {
    const { serialNumber } = req.params;
    const notification = await NotificationsRepo.findBySerialNumber(serialNumber);
    if (notification) {
      const { message } = notification;
      res.json({ code: 'SUCCESS', data: message });
    } else {
      res.json({ code: 'SUCCESS', data: '' });
    }
  };

  generateSendReports = (reports: string[]) => {
    try {
      return reports
        .map(_ => {
          if (_) {
            const splittedReportItem = _.split(',');
            const taskid = splittedReportItem[0];
            const recipient = splittedReportItem[1];
            const statusCode = splittedReportItem[2];
            const status = splittedReportItem[3];
            const serialNumber = splittedReportItem[4];
            const sendDate = string2Date(splittedReportItem[5], true, 'YYYYMMDDHHmmss');
            return {
              taskid,
              recipient,
              statusCode,
              status,
              serialNumber,
              sendDate
            };
          } else {
            return null;
          }
        })
        .filter(_ => {
          return _ != null;
        });
    } catch (err) {
      logger.error(`${err.toString()}, stack: ${err.stack}`);
      return undefined;
    }
  };

  getQrcodeUploadStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { data } = req.body;
    logger.info(`QRcode upload callback, ${data}`);
    res.json({ code: 'SUCCESS' });
  };
}
