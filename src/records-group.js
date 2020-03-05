// RecordsGroup
// Holds a records group with date and type
export default class RecordsGroup {
    constructor(name,type, ...args) {
        this._type = type;
        this._name = name;
        this._date = 
            (args.length == 2) ?
                args[0] :
                new Date().toISOString().replace("T", " ").substring(0, 19);
        this._id = this.generateID();
        this._records = (args.length == 2) ? args[1]: [];
    }

    get id (){return this._id;}
    get date (){return this._date;}
    get type (){return this._type;}
    set type(t){this._type = t;}
    get records (){return this._records;}
    get name (){return this._name;}
    set name (name){
        this._name = name;
        this._id = this.generateID();
    }
    
    generateID () { 
        return this._name; 
    }
    addRecord(r) {
        this._records.push(r);
    }
    deleteRecord(id) {
        this._records =
            this._records.filter(r => r.id !== id);
        console.log("deleted: " +id);
        console.log(this._records);
    }
    setTrackedStatus(id, status) {
        let r = this._records.find(r => r.id === id);
        r.tracked = status;
    }
    getTrackedStatus(id) {
        let r = this._records.find(r => r.id === id);
        return r.tracked ;
    }
    toPrettyString(){
        let dashes = "\n" + "-".repeat(80) + "\n";
        let stars = "*".repeat(80) + "\n";
        let info = stars;
        info += `Records Group : ${this.name}\nCreated on: ${this.date}\n`;
        info += stars;
        info += this.records.map(r => r._summary).join(dashes);
        return info;
    }
    getRecord(id){
        let r = this._records.find(r => r.id === id);
        console.log(r);
        return r;
    }
    toBlob(){
        return new Blob([this.toPrettyString()],{type: "text/plain", endings:"native"});
    }
}