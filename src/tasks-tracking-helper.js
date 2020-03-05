import  RecordsTemplate from './records-template.js';
import RecordsGroup from './records-group.js';
import HTMLViews from './html-views.js';
import TaskRecord from './task-record.js';
// Main Object Class
// Defines the main general variables and functions to start the app
export default class TasksTrackingHelper {

    constructor(){
        this._recordsTemplates = this.loadTemplates();
        this._selectedRecordsTemplate = this.loadSelectedTemplate();
        this._recordsGroupList = this.loadRecordsGroupList();
        this._selectedRecordsGroup = this.loadSelectedRecordsGroup(); 
        this._taskOutcomesSelected = [];
        this._unsavedRecord =  null;
        //this.loadUnsavedRecord();
        this._htmlViews = new HTMLViews(this);
    }

    storeUnsavedRecord(){
        this.localSave("unsavedRecord", this._unsavedRecord);
        this.localSave("unsavedOutcomes", this._taskOutcomesSelected);
    }

    resetUnsavedRecord(){
        this._unsavedRecord._fieldsInfo.forEach(field => field[1] ="");
        this._unsavedRecord._comments ="";
        this._taskOutcomesSelected = [];
        this._selectedRecordsTemplate.tasks
            .forEach(() => this._taskOutcomesSelected.push(0), this);
        this.storeUnsavedRecord();
    }

    loadUnsavedRecord(){
        let recordObj = this.loadLocalJSON("unsavedRecord");
        let comments = (recordObj) ? recordObj._comments : "";
        let record = new TaskRecord([],[],comments,"");
        let oldFieldsInfo = new Map(
            (recordObj) ? recordObj._fieldsInfo : []
        );
        let rt = this._selectedRecordsTemplate;
        let updatedFieldsInfo = [];
        rt._inputFieldNames.forEach(fieldName => {
            let value = (oldFieldsInfo.has(fieldName)) ?
                oldFieldsInfo.get(fieldName) : "";
            updatedFieldsInfo.push([fieldName, value]);
        });
        record._fieldsInfo = updatedFieldsInfo;
        this._unsavedRecord = record;

        let storedTaskOutcomes =
            this.loadLocalJSON("unsavedOutcomes", this._taskOutcomesSelected)
            || Array(rt.tasks.length).fill(0);
        let updatedTaskOutcomes = Array(rt.tasks.length).fill(0);
        let copyEnd = (storedTaskOutcomes.length >= rt.tasks.length) ?
            rt.tasks.length :
            storedTaskOutcomes.length;
        for (let index = 0; index < copyEnd; index++) {
            updatedTaskOutcomes[index] =
                (storedTaskOutcomes[index] <=
                    rt.tasks[index].taskOutcomes.length) ?
                    storedTaskOutcomes[index] : 0;

        }
        storedTaskOutcomes = updatedTaskOutcomes; 
        this._taskOutcomesSelected = storedTaskOutcomes;
    }
    get recordsGroupList () {return this._recordsGroupList};
    generateDefaultTemplateText() {
        let defaultTemplate = "";
        defaultTemplate +=
            (this._recordsTemplates.get("Default")) ?
                "Default " + new Date().toISOString() + "\n":
                "Default\n";
        defaultTemplate +=
            "Fields:ID\n" +
            "Tasks:\n" +
            "Completed?::Yes/No";
        return defaultTemplate;
    }

    loadRecordsGroupList(){
        let rgl = this.loadLocalJSON('recordsGroupList') || [];
        return rgl;
    }
    storeRecordsGroupList(){
        this.localSave('recordsGroupList', this.recordsGroupList);
    }

    storeSelectedRecordsGroup(){
        this.localSave("selectedRecordsGroup",this._selectedRecordsGroup.id );
        this.localSave(this._selectedRecordsGroup.id , this._selectedRecordsGroup);
    }

    loadSelectedRecordsGroup(){
        let recordsGroupID = localStorage.getItem("selectedRecordsGroup");
        recordsGroupID = JSON.parse(recordsGroupID);
        let rg = null;
        if (recordsGroupID != null) {
            let obj = this.loadLocalJSON(recordsGroupID);
            if (obj !== null){
                let records = obj._records.map(
                    r => {
                        let taskRecord = new TaskRecord(
                            r._fieldsInfo,
                            r._tasksAndOutcomes,
                            r._comments,
                            r._creationDate);
                        taskRecord.tracked = r._tracked;
                        return taskRecord ;
                    });
                rg = new RecordsGroup(obj._name, obj._type, obj._date, records);
            }  else {
                rg = this.setupNewRecordsGroup('Default Group','Default');
            } 

        } else {
            rg = this.setupNewRecordsGroup('Default Group', 'Default');

        }
        if (this._recordsTemplates.has(rg.type) &&
            (rg.type != this._selectedRecordsTemplate.name)) {
                this.selectedRecordsTemplate = rg.type
        } else if ( !this._recordsTemplates.has(rg.type)) {
            rg.type = this._selectedRecordsTemplate.name;
            this.storeSelectedRecordsGroup();
        }
        return rg;
    }
    deleteCurrentRecordsGroup(){
        let currentID = this._selectedRecordsGroup.id;
        this._recordsGroupList = this.recordsGroupList.filter( id => id != currentID );
        this.storeRecordsGroupList();
        this.localSave("selectedRecordsGroup", "");
        localStorage.removeItem(currentID);
        if (this.recordsGroupList.length > 0) {
            this.localSave("selectedRecordsGroup", this.recordsGroupList[0]);
        }
        this._selectedRecordsGroup = this.loadSelectedRecordsGroup();
    }
    setupNewRecordsGroup(name, type){
        let rg = new RecordsGroup(name,type);
        this._recordsGroupList.push(rg.id);
        this.storeRecordsGroupList();
        this._selectedRecordsGroup = rg;
        this.storeSelectedRecordsGroup();
        return rg;
    }
    changeSelectedRecordsGroup(id) {
        this.localSave("selectedRecordsGroup", id);
        this._selectedRecordsGroup = this.loadSelectedRecordsGroup();
    }
    renameCurrentRecordsGroup(newName){
        let repeated = this.recordsGroupList.includes(newName);
        if (!repeated) {
            let oldID = this._selectedRecordsGroup.id;
            this._selectedRecordsGroup.name = newName;
            this._recordsGroupList = this.recordsGroupList.filter( id => id != oldID);
            this._recordsGroupList.push(newName);
            this._recordsGroupList = this.recordsGroupList.sort();
            this.storeRecordsGroupList();
            this.storeSelectedRecordsGroup();
            localStorage.removeItem(oldID);
        }
    }

    get selectedRecordsTemplate(){
        return this._selectedRecordsTemplate;
    }
    set selectedRecordsTemplate(name){
        localStorage.setItem('selectedRecordsTemplate', name);
        this._selectedRecordsTemplate = this.loadSelectedTemplate();
    }

    updateSelectedTaskOutcome(taskIndex,outcomeIndex){
        this._taskOutcomesSelected[taskIndex] = outcomeIndex;
    }
    
    loadSelectedTemplate(){
        let name = localStorage.getItem("selectedRecordsTemplate");
        let rt  = name ? this._recordsTemplates.get(name): null;
        if (rt === null) {
            name = "Default";
            rt = this._recordsTemplates.get("Default");
            localStorage.setItem('selectedRecordsTemplate', name);
        }
        return rt;
    }


    changeCurrentRecordsTemplate(text) {
        let t = new RecordsTemplate(text);
        let currentName = this.selectedRecordsTemplate.name;
        if (t.name != currentName) {
            this._recordsTemplates.delete(currentName)
        }
        this._recordsTemplates.set(t.name, t);
        this.selectedRecordsTemplate = t.name;
        this.storeTemplates();
        this.loadTemplates();
        this._selectedRecordsGroup._type = t.name;
        this.storeSelectedRecordsGroup();
    }


    storeTemplates(){
        localStorage.setItem('selectedRecordsTemplate', this.selectedRecordsTemplate.name);
        let arr = Array.from(this._recordsTemplates).map( rt => rt[1].templateText);
        localStorage.setItem("storedTemplates", JSON.stringify(arr));
    }

    addTemplate(text){
        const rt = new RecordsTemplate(text);
        this._recordsTemplates.set(rt.name,rt);
        this.selectedRecordsTemplate = rt.name;
        this.storeTemplates();
    }
    deleteSelectedRecordsTemplate(){
        let stName = this.selectedRecordsTemplate.name
        this._recordsTemplates.delete(stName)
        this.storeTemplates();
        let newSelection = this._recordsTemplates.keys().next()
        if (newSelection.value) {
            this.selectedRecordsTemplate = newSelection.value;
        } else {
            this.loadTemplates();
        }
    }

    loadTemplates(){
        let jsonTemplates = this.loadLocalJSON('storedTemplates');
        this._recordsTemplates = new Map();
        if (jsonTemplates != null) {
            jsonTemplates.forEach(
                templateText => {
                    let rt = new RecordsTemplate(templateText);
                    this._recordsTemplates.set(rt.name, rt);
                }
            );
        }
        if (this._recordsTemplates.size == 0 ){
            console.log("No stored templates, generating default")
            let defaultTemplate =  this.generateDefaultTemplateText();
            let rt = new RecordsTemplate(defaultTemplate)
            this._recordsTemplates.set(rt.name, rt);
            this._selectedRecordsTemplate = rt;
            this.storeTemplates();
        }
        return this._recordsTemplates;
    }

    localSave(key, obj) {
        localStorage.setItem(key, JSON.stringify(obj));
    }

    loadLocalJSON (key) {
        let jsonString =  localStorage.getItem(key);
        return  ( jsonString != null) ?  JSON.parse(jsonString) : null;
    }
}
