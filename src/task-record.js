// TaskRecord
// Stores the outcomes and entered fields in a single string.
import {hash} from './trh.js';
export default class TaskRecord{
    constructor(fieldsInfo, tasksAndOutcomes , comments, creationDate) {
        this._fieldsInfo = fieldsInfo;
        this._tasksAndOutcomes = tasksAndOutcomes;
        this._comments = comments;
        this.tracked = false
        this._creationDate = creationDate;
        if (this._creationDate == "") {
            var now = new Date()
            this._creationDate = now.toISOString().replace("T", " ").substring(0, 19);
        }
        this._summary = this.getInfo();
    }
    get tracked(){ return this._tracked;}
    set tracked(val){this._tracked = val}
    async recalculateID () {
        this.id = await hash(this._summary);
    }
    getInfo() {
        let info = this._fieldsInfo.map(infoPair => infoPair.join(": ")).join("\n");
        info += "\n";
        info += this._tasksAndOutcomes.map(infoPair => infoPair.join(" ")).join("\n");
        info += "\n";
        info += "Comments:\n" + this._comments || "NA";
        info += "\n";
        info += "Date: " + this._creationDate;
        return info;
    }
    

}