// Reexport the native module. On web, it will be resolved to ReactNativeMarkdownEditorModule.web.ts
// and on native platforms to ReactNativeMarkdownEditorModule.ts
export { default } from './ReactNativeMarkdownEditorModule';
export { default as ReactNativeMarkdownEditorView } from './ReactNativeMarkdownEditorView';
export * from  './ReactNativeMarkdownEditor.types';
