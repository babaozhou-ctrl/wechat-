// 云数据库工具文件
const cloudbase = require('../cloudbase.config.js');

// 数据库集合名称
const COLLECTIONS = {
  DIET: 'diet_records',      // 饮食记录
  SPORT: 'sport_records',    // 运动记录
  WEIGHT: 'weight_records',  // 体重记录
  WATER: 'water_records',    // 饮水记录
  SLEEP: 'sleep_records',     // 睡眠记录
  STEPS: 'steps_records',    // 步数记录
  USER: 'user_info'          // 用户信息
};

// 云数据库单例
let db = null;
let _ = null;

/**
 * 获取数据库实例
 */
function getDb() {
  if (!db) {
    db = wx.cloud.database({
      env: cloudbase.envId
    });
    _ = db.command;
  }
  return { db, _ };
}

/**
 * 添加记录到云数据库
 * @param {string} collectionName - 集合名称
 * @param {object} data - 要添加的数据
 * @returns {Promise}
 */
async function addRecord(collectionName, data) {
  try {
    const { db } = getDb();
    const result = await db.collection(collectionName).add({
      data: {
        ...data,
        createTime: Date.now(),
        updateTime: Date.now()
      }
    });
    console.log('云数据库添加成功', result);
    return { success: true, id: result._id };
  } catch (e) {
    console.error('云数据库添加失败', e);
    return { success: false, error: e.message };
  }
}

/**
 * 查询记录列表
 * @param {string} collectionName - 集合名称
 * @param {object} query - 查询条件
 * @param {number} limit - 限制返回数量
 * @param {number} skip - 跳过数量
 * @returns {Promise}
 */
async function queryRecords(collectionName, query = {}, limit = 100, skip = 0) {
  try {
    const { db, _ } = getDb();
    const result = await db.collection(collectionName)
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get();
    return { success: true, data: result.data };
  } catch (e) {
    console.error('云数据库查询失败', e);
    return { success: false, error: e.message, data: [] };
  }
}

/**
 * 更新记录
 * @param {string} collectionName - 集合名称
 * @param {string} id - 记录ID
 * @param {object} data - 要更新的数据
 * @returns {Promise}
 */
async function updateRecord(collectionName, id, data) {
  try {
    const { db } = getDb();
    const result = await db.collection(collectionName).doc(id).update({
      data: {
        ...data,
        updateTime: Date.now()
      }
    });
    return { success: true, updated: result.stats.updated };
  } catch (e) {
    console.error('云数据库更新失败', e);
    return { success: false, error: e.message };
  }
}

/**
 * 删除记录
 * @param {string} collectionName - 集合名称
 * @param {string} id - 记录ID
 * @returns {Promise}
 */
async function deleteRecord(collectionName, id) {
  try {
    const { db } = getDb();
    const result = await db.collection(collectionName).doc(id).remove();
    return { success: true, deleted: result.stats.removed };
  } catch (e) {
    console.error('云数据库删除失败', e);
    return { success: false, error: e.message };
  }
}

/**
 * 获取单条记录
 * @param {string} collectionName - 集合名称
 * @param {string} id - 记录ID
 * @returns {Promise}
 */
async function getRecord(collectionName, id) {
  try {
    const { db } = getDb();
    const result = await db.collection(collectionName).doc(id).get();
    return { success: true, data: result.data };
  } catch (e) {
    console.error('云数据库获取记录失败', e);
    return { success: false, error: e.message };
  }
}

/**
 * 批量添加记录
 * @param {string} collectionName - 集合名称
 * @param {Array} records - 记录数组
 * @returns {Promise}
 */
async function batchAddRecords(collectionName, records) {
  try {
    const { db } = getDb();
    const promises = records.map(record => {
      return db.collection(collectionName).add({
        data: {
          ...record,
          createTime: Date.now(),
          updateTime: Date.now()
        }
      });
    });
    const results = await Promise.all(promises);
    return { success: true, count: results.length };
  } catch (e) {
    console.error('云数据库批量添加失败', e);
    return { success: false, error: e.message };
  }
}

/**
 * 迁移本地数据到云数据库
 * @param {string} storageKey - 本地存储键名
 * @param {string} collectionName - 云数据库集合名称
 * @returns {Promise}
 */
async function migrateFromLocalStorage(storageKey, collectionName) {
  try {
    const localData = wx.getStorageSync(storageKey) || [];
    if (localData.length === 0) {
      return { success: true, migrated: 0 };
    }
    
    // 添加迁移标记
    const recordsToMigrate = localData.map(item => ({
      ...item,
      migratedFromLocal: true,
      originalId: item.id
    }));
    
    const result = await batchAddRecords(collectionName, recordsToMigrate);
    
    if (result.success) {
      // 标记为已迁移
      wx.setStorageSync(`${storageKey}_migrated`, true);
    }
    
    return result;
  } catch (e) {
    console.error('数据迁移失败', e);
    return { success: false, error: e.message };
  }
}

// 导出
module.exports = {
  COLLECTIONS,
  getDb,
  addRecord,
  queryRecords,
  updateRecord,
  deleteRecord,
  getRecord,
  batchAddRecords,
  migrateFromLocalStorage
};
