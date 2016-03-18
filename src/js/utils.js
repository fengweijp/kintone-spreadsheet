const utils = {
  // kintoneのレコード更新・追加時は、レコード番号などアップデートできないフィールドがあるので、除外するためのメソッド
  setParams: (record) => {
    var result = {};
    for (var prop in record) {
      if (['レコード番号', '作成日時', '更新日時', '作成者', '更新者', 'ステータス', '作業者'].indexOf(prop) === -1) {
        result[prop] = record[prop];
      }
    }
    return result;
  },
  
  // kintoneのレコード取得用メソッド
  getRecords: (callback, errorCallback) => {
    kintone.api('/k/v1/records', 'GET', {app: kintone.app.getId(), query: 'order by レコード番号 asc limit 500'},
      function(resp) {
        callback(resp);
      },
      function(resp) {
        errorCallback(resp);
      }
    );
  },
  
  // kintoneのレコード更新、追加用メソッド
  saveRecords: (records, changedDatas, callback, errorCallback) => { 
    var requests = [];
    var updateRecords = [];
    var insertRecords = [];
    var changedRows = [];
    var i;
  
    // 変更されたセルの配列から、変更があった行だけ抜き出す
    for(i = 0; i < changedDatas.length; i++) {
      changedRows.push(changedDatas[i][0]);
    }
    // 変更があった行番号の重複を排除
    changedRows = changedRows.filter(function (x, i, self) {
      return self.indexOf(x) === i;
    });
  
    // 変更があった行から、レコード追加か変更かを判断し、クエリをつくる
    for(i = 0; i < changedRows.length; i++) {
      if (records[changedRows[i]]["レコード番号"].value === null) {
        insertRecords.push(
          utils.setParams(records[changedRows[i]])
        );
      } else {
        updateRecords.push({
          id: records[changedRows[i]]["レコード番号"].value,
          record: utils.setParams(records[changedRows[i]])
        });
      }
    }
  
    // 更新用bulkRequest
    requests.push({
      method: "PUT",
      api: "/k/v1/records.json",
      payload: {
        app: kintone.app.getId(),
        records: updateRecords
      }
    });
  
    // 追加用bulkRequest
    requests.push({
      method: "POST",
      api: "/k/v1/records.json",
      payload: {
        app: kintone.app.getId(),
        records: insertRecords
      }
    });
  
    // bulkrequestで一括で追加、更新。
    // 失敗した場合はロールバックされる。
    kintone.api('/k/v1/bulkRequest', 'POST', {requests: requests},
      (resp) => {
        console.dir(requests);
        console.dir(resp);
        callback(resp);
      },
      (resp) => {
        errorCallback(resp);
      }
    );
  },
  
  // kintoneのレコード削除用メソッド
  deleteRecords: (records, index, amount, callback, errorCallback) => {
    var i;
    var ids = [];
    for(i = index; i < index+amount; i++) {
      ids.push(records[i]["レコード番号"].value);
    }
    kintone.api('/k/v1/records', 'DELETE', {app: kintone.app.getId(), ids: ids},
      (resp) => {
        callback(resp);
      },
      (resp) => {
        errorCallback(resp);
      }
    );
  },

  getColumnsFromConfig: (config) => {
    var result = [];
    Object.keys(config).forEach((key) => {
      if (key.substring(0, 6) === "column") {
        result.push(config[key]);
      }
    });
    return result;
  },
  
  getColumnData: (columns) => {
    return columns.map((column) => {
      return {
        data: `${column}.value`
      };
    });
  }
};

export default utils;