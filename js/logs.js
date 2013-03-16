function logs(id, clearAfterInput) {
    var log = document.querySelector(id);
    log.innerHTML = '';
    return function() {
        var message = Array.prototype.join.call(arguments, ' ');
        if (clearAfterInput) {
            log.innerHTML = message + '<br>';
        } else {
            log.innerHTML +=  message + '<br>';
        }

    }
}

module.exports = logs;
