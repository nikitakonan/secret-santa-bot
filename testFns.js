function testAllGifted(arr) {
    if (!arr.every(x => x.gifted)) {
        throw new Error(`Not all users are gifted`);
    }
}

function allHaveTo(arr) {
    if (!arr.every(x => typeof x.to === 'string')) {
        throw new Error(`Not all users are gifted`);
    }
}

function noDuplicate(arr) {
    const map = arr.map(x => x.to).reduce((acc, curr) => {
        if (curr in acc) {
            acc[curr]++;
        } else {
            acc[curr] = 1;
        }
        return acc;
    }, {});
    console.dir(map);
    if (Object.values(map).some(x => x > 1)) {
        throw new Error(`There are duplicates`);
    }
}

module.exports = {
    testAllGifted,
    allHaveTo,
    noDuplicate
}