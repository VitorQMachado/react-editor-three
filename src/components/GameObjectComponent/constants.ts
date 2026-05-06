import { FollowMode } from '@vmlibs/unit_three';

export const RAD_TO_DEG = 180 / Math.PI;
export const DEG_TO_RAD = Math.PI / 180;

export const ACTION_PHASE_OPTIONS = ['started', 'performed', 'canceled'] as const;
export const DEFAULT_INPUT_ACTIONS = ['move left', 'move right', 'MoveUp', 'MoveDown', 'fire', 'jump'] as const;
export const MOUSE_BINDING_OPTIONS = [
    '<Mouse>/leftButton',
    '<Mouse>/rightButton',
    '<Mouse>/middleButton',
    '<Mouse>/scroll/x',
    '<Mouse>/scroll/y',
    '<Mouse>/delta/x',
    '<Mouse>/delta/y',
] as const;

export const COMPONENT_METHOD_BLACKLIST = new Set([
    'constructor',
    'dispose',
    'destroy',
    'update',
    'init',
    'initialize',
    'start',
    'awake',
    'onenable',
    'ondisable',
    'ondestroy',
]);

export const LIGHT_TYPE_OPTIONS = [
    'DirectionalLight',
    'PointLight',
    'SpotLight',
    'AmbientLight',
    'HemisphereLight',
    'RectAreaLight',
] as const;

export const CAMERA_FOLLOW_MODE_OPTIONS: FollowMode[] = ['lookAt', 'follow'];
