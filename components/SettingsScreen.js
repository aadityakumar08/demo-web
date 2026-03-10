import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeModeContext } from '../contexts';
import { SHOP_NAME, CURRENCY, ADMIN_PASSWORD } from '../config';
import { t, setLanguage, getLanguage } from '../locales/i18n';

const SETTINGS_KEY = 'app_settings';
const LANG_KEY = 'app_language';

const SettingsScreen = () => {
  const theme = useTheme();
  const { themeMode, toggleTheme } = useContext(ThemeModeContext);
  const [shopName, setShopName] = useState(SHOP_NAME);
  const [currency, setCurrency] = useState(CURRENCY);
  const [adminPassword, setAdminPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLang] = useState(getLanguage() || 'en');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.shopName) setShopName(s.shopName);
        if (s.currency) setCurrency(s.currency);
      }
      const lang = await AsyncStorage.getItem(LANG_KEY);
      if (lang) {
        setLanguage(lang);
        setLang(lang);
      }
    })();
  }, []);

  const saveSettings = async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ shopName, currency }));
    Alert.alert(t('saved'), t('settings_updated'));
  };

  const changePassword = async () => {
    if (!adminPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('error'), t('fill_all_password_fields'));
      return;
    }
    if (adminPassword !== ADMIN_PASSWORD) {
      Alert.alert(t('error'), t('current_password_incorrect'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('new_passwords_do_not_match'));
      return;
    }
    // In a real app, update password in secure storage or backend
    Alert.alert(t('success'), t('password_changed'));
    setAdminPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    setLang(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
  };

  return (
    <Container>
      <Title accessibilityRole="header">⚙️ {t('settings')}</Title>
      <Label>{t('shop_name')}</Label>
      <Input
        value={shopName}
        onChangeText={setShopName}
        placeholder={t('shop_name')}
        accessibilityLabel={t('shop_name')}
      />
      <Label>{t('currency')}</Label>
      <Input
        value={currency}
        onChangeText={setCurrency}
        placeholder={t('currency')}
        accessibilityLabel={t('currency')}
      />
      <SaveButton onPress={saveSettings} accessibilityRole="button">
        <SaveText>{t('save')}</SaveText>
      </SaveButton>
      <Label>{t('theme')}</Label>
      <ThemeRow>
        <ThemeText>{t('dark_mode')}</ThemeText>
        <Switch value={Boolean(themeMode === 'dark')} onValueChange={toggleTheme} />
      </ThemeRow>
      <Divider />
      <Label>{t('change_language')}</Label>
      <LangRow>
        <LangButton
          $selected={language === 'en'}
          onPress={() => handleLanguageChange('en')}
          accessibilityRole="button"
        >
          <LangText $selected={language === 'en'}>{t('english')}</LangText>
        </LangButton>
        <LangButton
          $selected={language === 'hi'}
          onPress={() => handleLanguageChange('hi')}
          accessibilityRole="button"
        >
          <LangText $selected={language === 'hi'}>{t('hindi')}</LangText>
        </LangButton>
      </LangRow>
      <Divider />
      <Label>{t('change_admin_password')}</Label>
      <Input
        value={adminPassword}
        onChangeText={setAdminPassword}
        placeholder={t('current_password')}
        secureTextEntry
        accessibilityLabel={t('current_password')}
      />
      <Input
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={t('new_password')}
        secureTextEntry
        accessibilityLabel={t('new_password')}
      />
      <Input
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t('confirm_new_password')}
        secureTextEntry
        accessibilityLabel={t('confirm_new_password')}
      />
      <SaveButton onPress={changePassword} accessibilityRole="button">
        <SaveText>{t('change_password')}</SaveText>
      </SaveButton>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background: ${p => p.theme.background};
  padding: 32px 0 0 0;
`;
const Title = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: ${p => p.theme.primary};
  text-align: center;
  margin-bottom: 12px;
`;
const Label = styled.Text`
  color: #444;
  font-size: 17px;
  margin: 18px 24px 4px 24px;
`;
const Input = styled.TextInput`
  background: ${p => p.theme.card};
  border-radius: 8px;
  padding: 12px 16px;
  margin: 0 24px 12px 24px;
  font-size: 17px;
  color: ${p => p.theme.text};
`;
const SaveButton = styled.TouchableOpacity`
  background: ${p => p.theme.primary};
  margin: 10px 24px 0 24px;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
`;
const SaveText = styled.Text`
  color: #fff;
  font-weight: bold;
  font-size: 16px;
`;
const ThemeRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin: 0 24px 0 24px;
`;
const ThemeText = styled.Text`
  color: #444;
  font-size: 17px;
`;
const Divider = styled.View`
  height: 1px;
  background: #eee;
  margin: 24px 0;
`;
const LangRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  margin: 0 24px 0 24px;
`;
const LangButton = styled.TouchableOpacity`
  background: ${p => (p.$selected ? p.theme.primary : '#eee')};
  padding: 8px 18px;
  border-radius: 8px;
  margin-right: 12px;
`;
const LangText = styled.Text`
  color: ${p => (p.$selected ? '#fff' : '#222')};
  font-weight: bold;
  font-size: 16px;
`;

export default SettingsScreen;