
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
        this._lines = rawLines.filter(l => l.length > 0);
        try {
            // attempt parse
            let newName = this.generateNameFromTemplate();
            let newInputFieldNames = this.generateInputFields();
            let newTasks = this.generateTasks();
            // assign values if no errors returned
            this._name = newName;
            this._inputFieldNames = newInputFieldNames;
            this._inputFieldIDs = [];
            this._tasks = newTasks;
        } catch (error) {
            this._name = "Parse Error";
            this._inputFieldNames = ["Error"];
            this._inputFieldIDs = [];
            this._tasks = [new Task("Error::Error")];
            console.log(error);
        }

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
        if (this._lines[0].match(/[^\s]+/)) {
            return this._lines[0];
        } else {
            throw new SyntaxError("No name entered");
        }
    }
    generateInputFields(){
        if (this._lines[1] !== undefined) {
            let reg = /(?<=^Fields:\s*).+/;
            let match = this._lines[1].match(reg);
            if (match) {
                return match[0].split(',');

            } else {
                throw new SyntaxError("No fields entered");
            }
        } 
    }
    generateTasks(){
        let tasks = [];
        let lines = this._templateText.split('\n');
        if (lines[2].match(/Tasks:\n/g) != 0 ){
            for (let index = 3, count = lines.length; index < count; index++) {
                const element = lines[index];
                tasks.push(new Task(element));
            }
        } else {
                throw new SyntaxError("No tasks entered");
        }
        return tasks;
    }

}