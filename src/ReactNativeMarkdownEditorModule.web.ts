import { registerWebModule, NativeModule } from 'expo';

import { ReactNativeMarkdownEditorModuleEvents } from './ReactNativeMarkdownEditor.types';

class ReactNativeMarkdownEditorModule extends NativeModule<ReactNativeMarkdownEditorModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ReactNativeMarkdownEditorModule, 'ReactNativeMarkdownEditorModule');
