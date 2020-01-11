/**
 * @author 成雨
 * @date 2019/11/29
 * @Description:
 */

function serializeArray(_this) {

    var name, type, result = [],
        add = function(value) {
            if (value.forEach) return value.forEach(add)
            result.push({ name: name, value: value })
        }
    if (_this) ([].slice.apply(_this.elements)).forEach(function(field, _){
        type = field.type, name = field.name;
        if (name && field.nodeName.toLowerCase() != 'fieldset' &&
            !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
            ((type != 'radio' && type != 'checkbox') || field.checked))
            add(field.value)
    });
    return result
}

module.exports = {
    serializeArray
};
