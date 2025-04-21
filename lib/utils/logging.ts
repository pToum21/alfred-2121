import debug from 'debug';

class Logger {
  public static debug(...args: any[]) {
    console.log('[DEBUG]', ...args);
  }
  public static info(...args: any[]) {
    console.log('[INFO]', ...args);
  }
  public static warn(...args: any[]) {
    console.log('[WARN]', ...args);
  }
  public static error(...args: any[]) {
    console.log('[ERROR]', ...args);
  }
  public static auth(...args: any[]) {
    console.log('[AUTH]', ...args);
  }

  public static logMessages(source: string, messages: any[]) {
    const messageData = messages.map(msg => ({
      role: msg.role,
      type: msg.type,
      name: msg.name,
      contentPreview: typeof msg.content === 'string' 
        ? msg.content.substring(0, 100) 
        : 'non-string content'
    }));

    this.debug(source, 'Current messages state:', messageData);
  }
}

export default Logger; 
