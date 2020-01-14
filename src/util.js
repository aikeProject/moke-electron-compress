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

const chunk = (arr, size) => {
    return Array.from({
            length: Math.ceil(arr.length / size)
        }, (v, i) =>
            arr.slice(i * size, i * size + size)
    );
};

const flattenArr = (arr) => {
    return arr.reduce((map, item) => {
        map[item.id] = item;
        return map
    }, {})
};

const objToArr = (obj) => {
    return Object.keys(obj).map(key => obj[key]);
};

const firstLastArr = (arr, size) => {
    let first = [],
        last = [];
    (arr || []).forEach(((value, index) => {
        if (index < size) first = [...first, value];
        else last = [...last, value];
    }));

    return {
        first,
        last
    }
};

module.exports = {
    serializeArray,
    chunk,
    flattenArr,
    objToArr,
    firstLastArr
};
