import type { Task, TaskDealRelation } from '../types'

export function getTaskSortAmount(task: Task): number {
  if (task.type === 'Rétention livret') {
    return task.relation.projectAmount
  }
  return task.relation.dealAmount
}

export function getTaskFilterProjectType(task: Task) {
  if (task.type === 'Rétention livret') {
    return task.relation.projectType
  }
  return task.relation.projectType
}

export function getDealRelationSubtitle(relation: TaskDealRelation): string {
  if (relation.projectCount === 1 && relation.singleProjectName) {
    return relation.singleProjectName
  }
  return `${relation.projectCount} projets`
}

export function getDealRelationDetailLine(relation: TaskDealRelation): string {
  return `${formatTaskCurrency(relation.dealAmount)} · ${relation.dealEtape} · ${getDealRelationSubtitle(relation)}`
}

export function formatTaskCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount)
}
