import * as _ from 'lodash';
import * as configAll from './env/all';
const configEnv = process.env.NODE_ENV === 'production' ? require(`./env/production`) : require(`./env/development`);
export default _.merge({}, configEnv, configAll.default);
