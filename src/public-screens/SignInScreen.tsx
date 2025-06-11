// // external dependencies
// import React, { useState, useCallback } from 'react';
// import { View, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
// import { useDispatch } from 'react-redux';
// import { signInActions } from '../store/slices/signInSlice';
// import { ROUTES } from '../constants/routes';
// import { navigate } from '../services/navigation';
// import { MessageService } from '../services/messages';
// import { Text, TextInput, Button, IconButton } from '@react-native-material/core';
// import Icon from 'react-native-vector-icons/Ionicons';
// import Screen from '../components/Screen';
// import { useTheme } from '../hooks/useTheme';
// import BackgroundImage from '../components/BackgroundImage';
// // import { LogoAnimate } from '../components/LogoAnimate';

// interface FormData {
//   username: string;
//   password: string;
// }

// const validateEmail = (email: string): boolean => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// export const SignInScreen: React.FC = (): React.ReactElement => {
//   const dispatch = useDispatch();
//   const theme = useTheme();
//   const [formData, setFormData] = useState<FormData>({
//     username: '',
//     password: '',
//   });
//   const [securePassword, setSecurePassword] = useState(true);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleChange = useCallback((field: keyof FormData, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   }, []);

//   const toggleSecurePassword = useCallback(() => {
//     setSecurePassword(prev => !prev);
//   }, []);

//   const handleSubmit = async () => {
//     try {
//       if (!formData.username || !formData.password) {
//         MessageService.error({
//           uid: 'SignIn',
//           title: 'Validation Error',
//           message: 'Please fill in all fields',
//         });
//         return;
//       }

//       if (!validateEmail(formData.username)) {
//         MessageService.error({
//           uid: 'SignIn',
//           title: 'Validation Error',
//           message: 'Please enter a valid email address',
//         });
//         return;
//       }

//       setIsLoading(true);
//       dispatch(signInActions.submit(formData));
//     } catch (error) {
//       MessageService.error({
//         uid: 'SignIn',
//         title: 'Sign In Error',
//         message: error instanceof Error ? error.message : 'Authentication failed',
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Screen initialized={true} style={styles.container}>
//       <BackgroundImage>
//         <Text color={theme.colors.background}>Welcome to</Text>
//         {/* <LogoAnimate size={150} /> */}
//       </BackgroundImage>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.formContainer}
//       >
//         <Text
//           variant="h4"
//           color={theme.colors.text}
//           style={styles.title}
//         >
//           Sign In
//         </Text>
//         <TextInput
//           label="Email"
//           value={formData.username}
//           onChangeText={(value) => handleChange('username', value)}
//           keyboardType="email-address"
//           autoCapitalize="none"
//           autoComplete="email"
//           leading={props => <Icon name="mail-outline" {...props} />}
//           style={styles.input}
//           editable={!isLoading}
//         />
        
//         <TextInput
//           label="Password"
//           value={formData.password}
//           onChangeText={(value) => handleChange('password', value)}
//           secureTextEntry={securePassword}
//           autoComplete="password"
//           leading={props => <Icon name="lock-closed-outline" {...props} />}
//           trailing={props => (
//             <IconButton
//               icon={props => (
//                 <Icon
//                   name={securePassword ? "eye-outline" : "eye-off-outline"}
//                   {...props}
//                 />
//               )}
//               onPress={toggleSecurePassword}
//             />
//           )}
//           style={styles.input}
//           editable={!isLoading}
//         />
        
//         <Button
//           title={isLoading ? "Signing in..." : "Sign In"}
//           onPress={handleSubmit}
//           disabled={isLoading}
//           loading={isLoading}
//           style={styles.button}
//         />
        
//         <View style={styles.linksContainer}>
//           <TouchableWithoutFeedback onPress={() => navigate(ROUTES.FORGOT_PASSWORD)}>
//             <View style={styles.link}>
//               <Text
//                 variant="h4"
//                 color={theme.colors.primary}
//                 style={styles.forgotPassword}
//               >
//                 Forgot Password?
//               </Text>
//             </View>
//           </TouchableWithoutFeedback>

//           <TouchableWithoutFeedback>
//             <View style={styles.link}>
//               <Text variant="caption" color={theme.colors.textSecondary}>
//                 Terms and conditions
//               </Text>
//             </View>
//           </TouchableWithoutFeedback>
//         </View>
//       </KeyboardAvoidingView>
//     </Screen>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   formContainer: {
//     flex: 1,
//     padding: 16,
//     justifyContent: 'center',
//   },
//   input: {
//     marginBottom: 16,
//   },
//   button: {
//     marginTop: 30,
//   },
//   linksContainer: {
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   link: {
//     marginTop: 10,
//     alignItems: 'center',
//   },
//   title: {
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   forgotPassword: {
//     marginTop: 10,
//   },
// });
