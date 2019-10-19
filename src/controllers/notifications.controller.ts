import { Request, Response, NextFunction } from 'express';
import { string2Date } from '../utils/dateUtil';
import logger from '../utils/logger';
import NotificationsRepo from '../repositories/notifications.repository';

export class NotificationsController {
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
    if (sendReports) {
      sendReports.forEach(async report => {
        const { taskId } = report;
        const notification = await NotificationsRepo.findByTaskId(taskId);
        let message = undefined;
        if (notification) {
          message = notification.message;
        }
        const notificationToUpdate = Object.assign({ message }, report);
        logger.info(`Sms report: ${notificationToUpdate}`);
        // await NotificationsRepo.saveOrUpdate(notificationToUpdate);
      });
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
      return reports.map(_ => {
        const splittedReportItem = _.split(',');
        const taskId = splittedReportItem[0];
        const mobiles = [splittedReportItem[1]];
        const statusCode = splittedReportItem[2];
        const status = splittedReportItem[3];
        const serialNumber = splittedReportItem[4];
        const sendDate = string2Date(splittedReportItem[5], true, 'YYYYMMDDHHmmss');
        return { taskId, mobiles, statusCode, status, serialNumber, sendDate };
      });
    } catch (err) {
      logger.error(`${err.toString()}, stack: ${err.stack}`);
      return undefined;
    }
  };
}
