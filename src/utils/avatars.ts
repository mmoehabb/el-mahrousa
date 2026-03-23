import merchantAvatar from '../assets/avatars/merchant.webp'
import auntAvatar from '../assets/avatars/aunt.webp'
import youthAvatar from '../assets/avatars/youth.webp'
import ceoAvatar from '../assets/avatars/ceo.webp'
import businessAvatar from '../assets/avatars/business.webp'
import projectAvatar from '../assets/avatars/project.webp'

export const AVATARS: Record<string, string> = {
  merchant: merchantAvatar,
  aunt: auntAvatar,
  youth: youthAvatar,
  ceo: ceoAvatar,
  business: businessAvatar,
  project: projectAvatar,
}

export const AVATAR_NAMES: Record<string, string> = {
  merchant: 'The Clever Merchant',
  aunt: 'The Rich Aunt',
  youth: 'The Trendy Youth',
  ceo: 'The CEO/Founder',
  business: 'The Business Manager',
  project: 'The Project Manager',
}

export const getAvatarPath = (avatarKey: string): string => {
  return AVATARS[avatarKey] || merchantAvatar
}
