// NOTE This is mutating function
module.exports = function (users) {
    if (users.length === 0) {
        return [];
    }
    if (users.length === 1) {
        const [only] = users;
        // gift to yourself
        only.to = only.name;
        return users;
    }
    users.forEach((user, i) => {
        const toGift = users.filter((u, j) => !u.gifted && j !== i);
        if (toGift.length === 0) {
            // last gift to last
            // exchange
            const prev = users[i - 1];
            user.to = prev.to;
            prev.to = user.name;
        } else {
            const idx = Math.floor(Math.random() * toGift.length);
            const to = toGift[idx];
            to.gifted = true;
            user.to = to.name;
        }
    });

    return users;
}