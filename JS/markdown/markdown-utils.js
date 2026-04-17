function applySubSupRules(md) {
    md.renderer.rules.text = function(tokens, idx) {
        let text = tokens[idx].content;
        text = text.replace(/\^\(([^)]+)\)/g, '<sup>$1</sup>');
        text = text.replace(/\_\(([^)]+)\)/g, '<sub>$1</sub>');
        return text;
    };
}
