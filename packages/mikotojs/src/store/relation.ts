import { makeAutoObservable } from 'mobx';
import { MikotoClient } from '../MikotoClient';
import { Relation, Space, User } from '../hs-client';
import { Store } from './base';

export class ClientRelation implements Relation {
  id!: string;
  space!: Space | null;
  relation!: User | null;

  constructor(
    public client: MikotoClient,
    data: Relation,
  ) {
    Object.assign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }
}

export class RelationStore extends Store<Relation, ClientRelation> {
  
} 
