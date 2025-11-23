export const log = (options) => {
    let msg, type, trace;
    if (typeof options == 'object') {
        msg = options?.msg;
        type = options?.type;
        trace = options?.trace;
        if (!msg) msg = options;
    } else {
        msg = options;
    }

    if (!type) return console.log(msg);
    if (type == 'error') return console.error(msg);
    if (type == 'info') return console.info(msg);

    if (trace) console.trace();
};

export const groupStart = (msg) => {
    console.groupCollapsed(msg);
};
export const groupEnd = (msg) => {
    console.groupEnd();
};
