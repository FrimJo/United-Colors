import * as ScreenOrientation from 'expo-screen-orientation';
import * as SystemUI from 'expo-system-ui';

export const bootstrapApp = async (): Promise<void> => {
  await SystemUI.setBackgroundColorAsync('#78b7e2');
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
};
