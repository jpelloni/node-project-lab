module.exports = function delay(ms, id) {
    return new Promise(resolve => {
        console.log(`inside delay ${id}`);
        setTimeout(resolve, ms);
    });
};