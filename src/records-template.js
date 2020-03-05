
import  {hash}  from './trh.js';
import Task from './task.js';
// RecordsTemplate
// Stores input values and tasks related to 
// a Record type
export default class RecordsTemplate {
    constructor(templateText){
        this._templateText = templateText;
        this.updateTemplate();
    }
    get name() { return this._name; }
    set name(n) { this._name = n; }
    get inputFieldNames() { return this._inputFieldNames; }
    get inputFieldIDs() { return this._inputFieldIDs; }
    get tasks() { return this._tasks; }
    get templateText() { return this._templateText; }
    set templateText(text) { 
        this._templateText = text; 
        this.updateTemplate(); 
    }

    updateTemplate() {
        let rawLines = this._templateText.split('\n');
        this._lines = rawLines.filter(l => l != "");
        this._name = this.generateNameFromTemplate();
        this._inputFieldNames = this.generateInputFields();
        this._inputFieldIDs = [];
        this._tasks = this.generateTasks();

    }

    async updateInputIDs(){
        this._inputFieldIDs = [];
        let ids = []
        for (let index = 0, length = this._inputFieldNames.length; index < length; index++) {
            ids.push(await hash(this._inputFieldNames[index]))
        }
        this._inputFieldIDs = ids;
        return ids;
    }

    generateNameFromTemplate(){
        return this._lines[0];
    }
    generateInputFields(){
        let line = this._lines[1];
        return line.replace(/Fields:\s*/,'').split(',');
    }
    generateTasks(){
        let tasks = [];
        let lines = this._templateText.split('\n');
        if (lines[2].match(/Tasks:\n/g) != 0 ){
            for (let index = 3, count = lines.length; index < count; index++) {
                const element = lines[index];
                tasks.push(new Task(element));
            }
        }
        return tasks;
    }

}