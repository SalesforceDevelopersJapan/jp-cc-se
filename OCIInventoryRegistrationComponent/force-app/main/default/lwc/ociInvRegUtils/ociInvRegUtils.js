import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// variant = info (default), success, warning, and error
export function showToast(that, title, message, variant) {
    const event = new ShowToastEvent({
        title,
        message,
        variant
    });
    that.dispatchEvent(event);
}

export function printFormat(template, ...arg) {
    if(!template){
        return "";
    }
    for(let i = 0; i < arg.length; i++){
        template = template.replace(`{${i}}`, arg[i]);
    }
    return template
}
