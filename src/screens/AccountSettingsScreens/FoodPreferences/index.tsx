// outsource dependencies
import React from 'react';

// local dependencies
import { TREE_TYPE } from 'constants/spec.ts';
import { FoodCategory } from 'screens/AccountSettingsScreens/components/FoodCategory.tsx';

const FoodPreferences = () => <FoodCategory treeTypeViewLabel={TREE_TYPE.DISLIKE} />;

export default FoodPreferences;

