/******************************************************************************
 * 2022/5/26  カスタマイズファイル新規作成
 *            日付選択時に各フィールドに値を自動入力する処理を追加
 *            未入力時のエラー処理を追加
 *            基準日外となる日付の際にエラーとなる処理を追加
 *            
 * 
 * 
*******************************************************************************/


(function() {
    'use strict';
    
    //*******************************************************
    // 日付選択時に各フィールドに値を自動入力する処理
    // ※時間処理にluxonを利用
    //*******************************************************
    let autoInput = function(event){
      let record = event.record;
      let table = record.テーブル.value;
      //日付選択時に各フィールドに値を自動入力する処理
      for (let i = 0; i < table.length; i ++){
       
        let tRecord = table[i].value;
        let dateValue = tRecord.日付.value||'';
        let dt = luxon.DateTime.fromISO(dateValue);
        let dayOfWeek = dt.weekdayShort;
        
        if (dateValue !== ''){
           //曜日を自動入力
          tRecord.曜日.value = dayOfWeek;
          
          //1か月後の日付を自動入力
          let oneMonthLater = dt.plus({month: 1});
          tRecord.一か月後の日付.value = oneMonthLater.toFormat('yyyy-MM-dd');
        } 
      }
    };
    
    
    //******************************************************
    //フィールドの変更不可設定
    //******************************************************
    //曜日と一か月後の日付フィールドの変更不可設定
    let disabledField = function(event){
      let record = event.record;
      let table = record.テーブル.value;
      for (let i = 0; i < table.length; i ++){
        table[i].value.曜日.disabled = true;
        table[i].value.一か月後の日付.disabled = true;
      }
      //明細件数フィールドの設定不可設定
      record.明細件数.disabled = true;
    };
    
    
    //*****************************************************
    // 入力チェック処理
    //*****************************************************
    let tValid = function(event){
      let record = event.record;
      let table = record.テーブル.value;
      let errors = [];
      
      for (let i = 0; i < table.length; i++){
        let tRecord = table[i].value;
        let date = tRecord.日付.value||'';
        let time = tRecord.時間.value||'';
        let work = tRecord.作業名.value||'';
        
        //すべて空欄の場合は次のfor処理へ
        if ((time === '') && (date === '') && (work === '')) {
          continue;
        }
  
        //日付、時間、作業名のいずれかが空欄だとエラーになる処理
        
        if (date === ''){
          tRecord.日付.error = '日付が未入力です。';
          if (errors.includes('日付') === false){
            errors.push('日付');
          }
        }
        if (time === ''){
          tRecord.時間.error = '時間が未入力です。';
          if (errors.includes('時間') === false){
            errors.push('時間');
          }
        }
        if (work === ''){
          tRecord.作業名.error = '作業名が未入力です。';
           if (errors.includes('作業名') === false){
             errors.push('作業名');
           }
        }
  
        
        //基準日外の時にエラーとする処理
        let baseDate =  record.基準日.value||''; //基準日フィールド
        
        //基準日または日付が空の場合は次のfor処理へ
        if ((date === '')||(baseDate === '')){
          continue;
        }
        //基準日設定
        //年度設定　→　9月1日～翌年8月末
        let checkDate = luxon.DateTime.fromISO(date);　//日付フィールド
        let startMonth = 9; //基準月
        let startDay = 1; //基準日
        
        //基準日に対する日付フィールドが期間内かどうかの判断
        if (dateIs(startMonth,startDay,baseDate,checkDate)){
          continue;
        }
        
        //期間外の場合に以下のエラーを表示
        tRecord.日付.error = '日付が基準日外です。';
        event.error = '日付が基準日外で入力されています。';
      }
      
      //エラーがあった場合、エラー表示する処理
      if (errors.length !== 0){
        event.error = errors.join('、') + 'に未入力の項目があります。';
      }
    };
    
    
    //***********************************************************
    // 範囲内かどうかを判断する関数　
    // @戻り値 範囲内の時true 範囲外の時false
    // tValid関数内で利用
    //***********************************************************
    let dateIs = function(startMonth,startDay,baseDate,checkDate){
      let baseYear = null; //基準年度
      let dt = luxon.DateTime.fromISO(baseDate);
      if (dt.month < startMonth){
        baseYear = dt.year - 1;
      } else {
        baseYear = dt.year;
      }
      
      let from = luxon.DateTime.fromObject({
        year: baseYear,
        month: startMonth,
        day: startDay
      });
      let to = from.plus({years: 1}).minus({days: 1});
      
      return from <= checkDate && checkDate <= to;
    };
    
    
    //***********************************************************
    // テーブル内レコードが空かどうかチェックして空なら要素を削除　
    // @戻り値 保存可能な状態のtRecord
    // tValid関数内で利用
    //***********************************************************
    let checkBrank = function(event){
      let record = event.record;
      let tRecords = record.テーブル.value;
      let rRecords = [];
      
      //１行のみの場合空の判断不要の処理
      if (tRecords.length === 1) return;
  
      //テーブル内レコードが空かどうかチェック
      for (let i = 0; i < tRecords.length; i++){
        let tRecord = tRecords[i].value;
        let checkHiduke = tRecord.日付.value||'';
        let checkSagyomei = tRecord.作業名.value||'';
        let checkJikan = tRecord.時間.value||'';
        
        //レコードがvalueがすべて空の場合は次のfor処理へ
        if (checkHiduke === ''&& checkSagyomei === '' && checkJikan === ''){
          continue;
        }
        //問題ないレコードをreturn用配列(eRecords)に追加
        rRecords.push({value:tRecord});
      }
      //複数行すべてが空の場合は、空のレコードをretur用配列（rRecords）に1行追加
      if (rRecords.length === 0){
        // let tmpRecord = tRecords[0].value;
        // Object.keys(tmpRecord).forEach(function(fid) {
        //   tmpRecord[fid].value = '';
        // });
        // rRecords.push({value : tmpRecord});
        
        rRecords.push({value: {一か月後の日付 :{type: 'DATE', value: ''}
                              ,作業名: {type: 'SINGLE_LINE_TEXT', value: ''}
                              ,日付: {type: 'DATE', value: ''}
                              ,時間: {type: 'NUMBER', value: ''}
                              ,曜日: {type: 'SINGLE_LINE_TEXT', value: ''}
                              }
                      });
      }
      record.テーブル.value = rRecords;
    };
    
    
    //***********************************************************
    // スペースにボタンを設置
    //***********************************************************
    let autoInputOneWeek = function(event){
      let record = event.record;
      //「1週間分反映」ボタンの設置
      let autoOneWeekButton = document.createElement('button');
      autoOneWeekButton.id = 'auto_one_week_button';
      autoOneWeekButton.innerText = '1週間分反映';
      autoOneWeekButton.classList.add('kintoneplugin-button-dialog-ok');
      
      //ボタンを押したときの処理
      autoOneWeekButton.onclick = function () {
        //クリック時の値チェックと1週間分のデータの自動入力
        clickProcess();
      };
      
      //スペースフィールドの取得（モバイル対応処理もしている）
      let el = kintone.app.record.getSpaceElement('bulk_ref') || kintone.mobile.app.record.getSpaceElement('bulk_ref'); 
      el.appendChild(autoOneWeekButton);
      
      //ボタンの位置調整
      if (kintone.app.record.getSpaceElement('bulk_ref') !== null){
        autoOneWeekButton.style.marginTop = '27px';
      } else {
        autoOneWeekButton.style.marginLeft = '5px';
      }
    };
    
    //************************************************
    //テーブルのレコード１行追加処理
    //addOneWeek関数で使用
    //************************************************  
    let addRow = function(dt,getRecord){
      // let dt = luxon.DateTime.fromISO(baseDate);
      // let num = dt.plus({days:i});
      let date = dt.toFormat('yyyy-MM-dd');
      let dayOfWeek = dt.weekdayShort;
      let oneMonthLater = dt.plus({month: 1}).toFormat('yyyy-MM-dd');
      getRecord.テーブル.value.push({
        value: {
          "一か月後の日付": {
            value: oneMonthLater,
            type: 'DATE',
            disabled: true,
          },
          "作業名": {
            value: '',
            type: 'SINGLE_LINE_TEXT',
          },
          "日付": {
            value: date,
            type: 'DATE',
          },
          "時間": {
            value: '',
            type: 'NUMBER',
          },
          "曜日": {
            value: dayOfWeek,
            type: 'SINGLE_LINE_TEXT',
            disabled: true,
          }
        }
      });
      // kintone.app.record.set({record: getRecord});
    };
    
    
    //***********************************************
    // 一週間分自動入力の処理
    // autoInputOneWeek関数のonclickイベントで使用
    //***********************************************
    let clickProcess = function(){
      let baseDate = kintone.app.record.get().record.基準日.value||'';
        
      //基準日が空ならアラートメッセージを出して処理を終了
      if (baseDate === ''){
        Swal.fire({
          icon: 'error',
          title: '基準日を入力してください'
        });
        return ;
      }
      
      //１週間分の日付を入力する前の確認ダイアログを表示
      //選択により条件分岐
      Swal.fire({
        html: '基準日を起点に１週間分をテーブルに反映します。<br>よろしいですか？',
        title: '確認',
        icon: 'question',
        showDenyButton: true,
        // showCancelButton: true,
        confirmButtonText: 'はい',
        denyButtonText: `いいえ`,
      }).then(function(result){
        if (!result.isConfirmed) {
          return;
        }
        //1週間分の日付データを自動入力
        const getRecord = kintone.app.record.get().record;
        
        //テーブルのリセット処理
        getRecord.テーブル.value = [];
        
        //一週間分自動入力の処理
        for (let i = 0; i < 7; i++ ){
          let dt = luxon.DateTime.fromISO(baseDate).plus({days:i});
          //テーブル１行追加の処理
          addRow(dt,getRecord);
        }
        kintone.app.record.set({record: getRecord});
        
        //反映完了メッセージ
        // alert('反映しました。');
        Swal.fire({
          // position: 'top-end',
          icon: 'success',
          title: '反映しました。',
          showConfirmButton: false,
          timer: 1500
        });
        
      });
    };
    
    
    //*****************************************
    //テーブル内のレコード数の計算,追加
    //*****************************************
    let recordCount = function(event){
      let record = event.record;
      let tRecords = record.テーブル.value;
      let count = 0;
        tRecords.forEach(function(tRecord){
          let check = tRecord.value.日付.value||'';
          console.log("sss");
        console.log(check);
        console.log("eee");
          if (check !== ''){
            count++;
          }
        });
  
      record.明細件数.value = count;
    };
    
    
    /****************************************************************************
     * 日付フィールドの値変更イベント時の処理
     * *************************************************************************/
    kintone.events.on(['app.record.edit.change.日付'
                      ,'app.record.create.change.日付'
                      ], function(event) {
      //日付が選択されたときに曜日、一か月後の日付フィールドへ自動入力
      autoInput(event);
      
      return event;
    });
    
    
    /****************************************************************************
     * テーブル内レコードの追加イベント時の処理
     * *************************************************************************/
    kintone.events.on(['app.record.edit.change.テーブル'
                      ,'app.record.create.change.テーブル'
                      ], function(event) {
      //曜日、一か月後の日付、明細件数フィールドの編集不可設定
      disabledField(event);
      //日付が選択されたときに曜日、一か月後の日付フィールドへ自動入力
      autoInput(event);
      
      return event;
    });
    
    
    /****************************************************************************
     * 表示イベント時の処理
     * *************************************************************************/
    kintone.events.on(['app.record.edit.show'
                      ,'app.record.create.show'
                      ,'mobile.app.record.edit.show'
                      ,'mobile.app.record.create.show'
                      ], function(event) {
      //曜日、一か月後の日付、明細件数フィールドの編集不可設定
      disabledField(event);
      //日付が選択されたときに曜日、一か月後の日付フィールドへ自動入力
      autoInput(event);
      //「1週間分反映」ボタンの設置
      autoInputOneWeek(event);
      
      return event;
    });
    
    
    /****************************************************************************
     * 保存前イベント時の処理
     * *************************************************************************/
    kintone.events.on(['app.record.edit.submit'
                      ,'app.record.create.submit'
                      ], function(event) {
      //テーブル内の（日付、時間、作業名のいずれかが空欄だとエラーになる処理）
      tValid(event);
      //空欄有ったら空欄行を削除する
      checkBrank(event);
      //テーブル内レコード数を明細件数に反映する処理
      recordCount(event);
      
      return event;
    });
    
  })();
  
  