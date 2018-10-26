const moment = require('moment');
exports.Helper = {


    /** 
     * 
     * Aufruf Casllback: date.forEach(dta => {
     * datum(dta, function(t) {
     *   console.log(t);
     *   });
     * });
     * 
     * oder :
     * datum("12.12.2020").dbAn;
     */
    datum: (dta, callback) => {
        //console.log("???????????????", QW);
        if (dta.match(/\d{4}-\d{2}-\d{2}/g) != null) {
            format = "YYYY-MM-DD";
        } else if (dta.match(/\d{2}\.\d{2}\.\d{4}/g) != null) {
            format = "DD.MM.YYYY";
        } else if (dta.match(/\d{2}\/\d{2}\/\d{4}/g) != null) {
            format = "DD/MM/YYYY";
        }

        var back = { db: moment(dta, format).format("YYYY-MM-DD"), dbAn: moment(dta, format).format("YYYY-MM-DDT" + QW.App.config.anreise), dbAb: moment(dta, format).format("YYYY-MM-DDT" + QW.App.config.abreise), de: moment(dta, format).format("DD.MM.YYYY") };

        if (callback == undefined) {
            return back;
        } else {
            callback(back);
        }
    },

    dateArray: (von, bis, callback) => {
        von = this.Helper.datum(von);
        bis = this.Helper.datum(bis);
        console.log("VON:", von);
        var dateArray = [];
        var a = -1;
        do {
            a++;
            var newDay = moment(von.db).add({
                days: a
            }).format("YYYY-MM-DD")
            dateArray.push(newDay);
        }
        while (moment(bis.db).format('YYYY-MM-DD') > newDay);

        if (callback == undefined) {
            return dateArray;
        } else {
            callback(dateArray);
        }
    },

    countDays: (von, bis, callback) => {
        var countDays = parseInt(this.Helper.dateArray(von, bis).length);
        if (callback == undefined) {
            return { days: countDays, nigths: countDays - 1 };
        } else {
            callback({ days: countDays, nigths: countDays - 1 });
        }
    }

}